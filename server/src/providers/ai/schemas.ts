import { z } from 'zod/v3';

// ─────────────────────────────────────────────────────────────
// Zod schema — validates AI provider output
// ─────────────────────────────────────────────────────────────
export const analysisResultSchema = z.object({
  score: z.number().min(0).max(100),
  grammarScore: z.number().min(0).max(100),
  readabilityScore: z.number().min(0).max(100),
  formattingScore: z.number().min(0).max(100),
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  weakBullets: z.array(z.string()),
  strongBullets: z.array(z.string()),
  actionVerbs: z.array(z.string()),
  passiveVoiceInstances: z.array(z.string()),
  repeatedWords: z.array(z.string()),
  sectionCompleteness: z.object({
    summary: z.boolean(),
    education: z.boolean(),
    experience: z.boolean(),
    projects: z.boolean(),
    skills: z.boolean(),
    certifications: z.boolean(),
    achievements: z.boolean(),
  }),
  suggestions: z.array(
    z.object({
      priority: z.enum(['high', 'medium', 'low']),
      category: z.string(),
      description: z.string(),
    })
  ),
  resumeLength: z.object({
    wordCount: z.number().int().min(0),
    pageEstimate: z.number().int().min(1).max(10),
    verdict: z.enum(['too_short', 'ideal', 'too_long']),
  }),
  grammarIssues: z.array(
    z.object({
      text: z.string(),
      suggestion: z.string(),
    })
  ),
});

// ─────────────────────────────────────────────────────────────
// Zod schema — ATS result
// ─────────────────────────────────────────────────────────────
export const atsResultSchema = z.object({
  atsScore: z.number().min(0).max(100),
  matchPercentage: z.number().min(0).max(100),
  keywordMatchPercentage: z.number().min(0).max(100),
  matchingKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  importantRequirements: z.array(
    z.object({
      requirement: z.string(),
      met: z.boolean(),
      notes: z.string(),
    })
  ),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  improvementSuggestions: z.array(
    z.object({
      priority: z.enum(['high', 'medium', 'low']),
      category: z.string(),
      suggestion: z.string(),
    })
  ),
  keywordDensity: z.array(
    z.object({
      keyword: z.string(),
      count: z.number().int().min(0),
      recommended: z.number().int().min(0),
    })
  ),
  sectionMatching: z.object({
    summary: z.boolean(),
    skills: z.boolean(),
    experience: z.boolean(),
    education: z.boolean(),
  }),
  aiSummary: z.string(),
});

// ─────────────────────────────────────────────────────────────
// Zod schema — Resume Optimization result
// ─────────────────────────────────────────────────────────────
const changeItemSchema = z.object({
  original: z.string().min(1),
  optimized: z.string().min(1),
  reason: z.string().min(1),
});

export const optimizationResultSchema = z.object({
  summary: z.string().min(1),
  optimizedSummary: z.string().min(1),
  experienceChanges: z.array(changeItemSchema),
  projectChanges: z.array(changeItemSchema),
  skillChanges: z.array(changeItemSchema),
  bulletPointChanges: z.array(changeItemSchema),
  keywordRecommendations: z.array(z.string()),
  overallChanges: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const interviewQuestionSchema = z.object({
  type: z.enum(['technical', 'behavioral', 'resume']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question: z.string().min(10).max(500),
  intent: z.string().min(5).max(500),
  followUpPrompts: z.array(z.string().min(5).max(300)).min(1).max(3),
  answerGuidance: z.string().min(10).max(1000),
});

export const interviewQuestionsResultSchema = z.object({
  questions: z.array(interviewQuestionSchema).min(6).max(10),
});

export const interviewAnswerFeedbackSchema = z.object({
  score: z.number().min(0).max(100),
  rubric: z.object({
    relevance: z.number().min(0).max(100),
    specificity: z.number().min(0).max(100),
    structure: z.number().min(0).max(100),
    evidence: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
  }),
  strengths: z.array(z.string().min(1).max(500)).max(6),
  improvements: z.array(z.string().min(1).max(500)).min(1).max(6),
  exampleAnswer: z.string().min(20).max(3000),
  followUpQuestion: z.string().min(5).max(500),
});
