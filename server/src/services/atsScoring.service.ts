import type { ATSResult } from '../providers/ai/ai.interface';

export const HYBRID_SCORING_METHOD = 'hybrid-v3' as const;

export interface ATSScoringBreakdown {
  skillCoverage: number;
  keywordCoverage: number;
  requirementCoverage: number;
  sectionCoverage: number;
  weights: {
    skills: number;
    keywords: number;
    requirements: number;
    sections: number;
  };
}

export interface HybridATSResult extends ATSResult {
  scoringMethod: typeof HYBRID_SCORING_METHOD;
  scoringBreakdown: ATSScoringBreakdown;
}

const SCORE_WEIGHTS = {
  skills: 0.35,
  keywords: 0.3,
  requirements: 0.25,
  sections: 0.1,
} as const;

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/c\+\+/g, 'cplusplus')
    .replace(/c#/g, 'csharp')
    .replace(/\.net/g, 'dotnet')
    .replace(/\bnode\.js\b/g, 'nodejs')
    .replace(/\breact\.js\b/g, 'reactjs')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

// Models sometimes attach a generic qualifier to a skill ("AWS deployment",
// "Docker experience"). Score the actual technology, while retaining compound
// skills such as "AWS Lambda" and "machine learning" as distinct requirements.
const technologyNames = [
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux',
  'Java', 'JavaScript', 'TypeScript', 'Python', 'C', 'C++', 'C#', '.NET', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  'React', 'React Native', 'Angular', 'Vue', 'Node.js', 'Next.js', 'Express', 'Django', 'Flask',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Git', 'PyTorch', 'TensorFlow', 'pandas', 'scikit-learn',
] as const;
const qualifiedTechnologies = new Set(technologyNames.map(normalize));

// Supplement (but never replace) model extraction with exact, named technologies
// in the job description. Longest-first spans keep "AWS Lambda" from also
// counting as a separate "AWS" requirement unless AWS appears independently.
const jobSkillNames = [...technologyNames, 'AWS Lambda'].filter((name) => name !== 'C' && name !== 'Go')
  .sort((a, b) => normalize(b).length - normalize(a).length);

const namedSkillsInJob = (jobDescription: string): string[] => {
  const text = ` ${normalize(jobDescription)} `;
  const used: Array<[number, number]> = [];
  const found: string[] = [];
  for (const name of jobSkillNames) {
    const needle = ` ${normalize(name)} `;
    let position = text.indexOf(needle);
    while (position !== -1) {
      const end = position + needle.length;
      if (!used.some(([start, finish]) => position < finish && start < end)) {
        used.push([position, end]);
        found.push(name);
        break;
      }
      position = text.indexOf(needle, position + 1);
    }
  }
  return found;
};

const canonicalSkill = (value: string): string => {
  const withoutPrefix = value.trim().replace(/^(?:(?:experience|expertise|proficiency|knowledge)\s+(?:with|in|of)\s+)/i, '');
  const match = withoutPrefix.match(/^(.+?)(?:\s+(?:deployment|experience|expertise|proficiency|knowledge|skills?|development))+$/i);
  // Preserve broader competencies such as "web development" and compound
  // products such as "AWS Lambda"; only known technology names lose qualifiers.
  if (match && qualifiedTechnologies.has(normalize(match[1]))) return match[1].trim();
  return qualifiedTechnologies.has(normalize(withoutPrefix)) ? withoutPrefix : value.trim();
};

const containsTerm = (text: string, term: string): boolean => {
  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  return ` ${normalizedText} `.includes(` ${normalizedTerm} `);
};

const countTerm = (text: string, term: string): number => {
  const normalizedText = ` ${normalize(text)} `;
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return 0;

  const needle = ` ${normalizedTerm} `;
  let count = 0;
  let cursor = 0;
  while ((cursor = normalizedText.indexOf(needle, cursor)) !== -1) {
    count += 1;
    cursor += needle.length;
  }
  return count;
};

const dedupeTerms = (terms: string[]): string[] => {
  const seen = new Set<string>();
  return terms.filter((term) => {
    const key = normalize(term);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const percentage = (matched: number, total: number): number =>
  total === 0 ? 0 : Math.round((matched / total) * 100);

/**
 * Converts the LLM's extracted ATS evidence into a reproducible score.
 *
 * The LLM still performs semantic extraction and writes recommendations, while
 * this function verifies literal keyword/skill matches and applies documented
 * weights. This prevents the model from freely inventing the final score.
 */
export const applyHybridATSScoring = (
  resumeText: string,
  llmResult: ATSResult,
  jobDescription?: string
): HybridATSResult => {
  const keywordCandidates = dedupeTerms([
    ...llmResult.matchingKeywords,
    ...llmResult.missingKeywords,
  ]);
  const skillCandidates = dedupeTerms([
    ...llmResult.matchingSkills,
    ...llmResult.missingSkills,
    ...(jobDescription ? namedSkillsInJob(jobDescription) : []),
  ].map(canonicalSkill)).filter((term) => !jobDescription || containsTerm(jobDescription, term));

  const matchingKeywords = keywordCandidates.filter((term) => containsTerm(resumeText, term));
  const missingKeywords = keywordCandidates.filter((term) => !containsTerm(resumeText, term));
  const matchingSkills = skillCandidates.filter((term) => containsTerm(resumeText, term));
  const missingSkills = skillCandidates.filter((term) => !containsTerm(resumeText, term));

  const keywordCoverage = percentage(matchingKeywords.length, keywordCandidates.length);
  const skillCoverage = percentage(matchingSkills.length, skillCandidates.length);
  const metRequirements = llmResult.importantRequirements.filter((item) => item.met).length;
  const requirementCoverage = percentage(metRequirements, llmResult.importantRequirements.length);
  const sectionValues = Object.values(llmResult.sectionMatching);
  const sectionCoverage = percentage(sectionValues.filter(Boolean).length, sectionValues.length);

  const atsScore = Math.round(
    skillCoverage * SCORE_WEIGHTS.skills +
      keywordCoverage * SCORE_WEIGHTS.keywords +
      requirementCoverage * SCORE_WEIGHTS.requirements +
      sectionCoverage * SCORE_WEIGHTS.sections
  );

  const recommendedCounts = new Map(
    llmResult.keywordDensity.map((item) => [normalize(item.keyword), item.recommended])
  );
  const keywordDensity = keywordCandidates.map((keyword) => ({
    keyword,
    count: countTerm(resumeText, keyword),
    recommended: recommendedCounts.get(normalize(keyword)) ?? 1,
  }));

  return {
    ...llmResult,
    atsScore,
    matchPercentage: requirementCoverage,
    keywordMatchPercentage: keywordCoverage,
    matchingKeywords,
    missingKeywords,
    matchingSkills,
    missingSkills,
    keywordDensity,
    scoringMethod: HYBRID_SCORING_METHOD,
    scoringBreakdown: {
      skillCoverage,
      keywordCoverage,
      requirementCoverage,
      sectionCoverage,
      weights: SCORE_WEIGHTS,
    },
  };
};
