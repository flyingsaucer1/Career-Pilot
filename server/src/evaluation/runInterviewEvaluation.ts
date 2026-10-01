import dotenv from 'dotenv';
import { GroqProvider } from '../providers/ai/groq.provider';
import { OllamaProvider } from '../providers/ai/ollama.provider';
import { buildGroundedExampleAnswer } from '../services/interviewGrounding.service';

dotenv.config();

// Synthetic-only evaluation. Read every generated question and example answer;
// structural success is not evidence that the coaching is factually sound.
const resume = `Avery Sample
B.Sc. Computer Science, 2024
Junior Developer, Northstar Apps, June 2024–Present
- Built a React and TypeScript dashboard used by 40 staff.
- Reduced page load time 18% by using code splitting.
Project: Support tracker
- Built a support tracker API with Node.js, Express, and MongoDB.
Skills: React, TypeScript, Node.js, Express, MongoDB.`;

const role = 'Frontend Developer';
const job = `Frontend developer needed to build accessible React and TypeScript interfaces, improve web performance, and work with REST APIs. Experience deploying applications with AWS and Docker is preferred.`;
const answer = `At Northstar Apps I improved dashboard performance using code splitting. I focused on the slowest route, changed the bundle boundaries, and measured an 18% reduction in page load time.`;

const choice = process.argv[process.argv.indexOf('--provider') + 1];
const provider = choice === 'ollama'
  ? new OllamaProvider(process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434', process.env.OLLAMA_MODEL || 'qwen3.5:4b', fetch, Number(process.env.OLLAMA_TIMEOUT_MS || 120000))
  : choice === 'groq'
    ? new GroqProvider(process.env.GROQ_API_KEY || '', process.env.GROQ_MODEL || 'openai/gpt-oss-120b', fetch, Number(process.env.GROQ_TIMEOUT_MS || 90000))
    : null;

if (!provider) throw new Error('Use --provider ollama or --provider groq.');

const run = async (): Promise<void> => {
  const started = performance.now();
  const result = await provider.generateInterviewQuestions(resume, role, job);
  const questionLatencyMs = Math.round(performance.now() - started);
  const types = Object.fromEntries(['technical', 'behavioral', 'resume'].map((type) => [
    type, result.questions.filter((question) => question.type === type).length,
  ]));
  const resumeQuestion = result.questions.find((question) => question.type === 'resume') ?? result.questions[0];
  const feedbackStarted = performance.now();
  const feedback = await provider.evaluateInterviewAnswer(resume, role, resumeQuestion, answer);
  const feedbackLatencyMs = Math.round(performance.now() - feedbackStarted);
  const resumeSpecificUnsupportedTerms = result.questions
    .filter((question) => question.type === 'resume')
    .flatMap((question) => ['AWS', 'Docker'].filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(question.question)));
  const unsupportedExperienceAssumptions = result.questions.flatMap((question) =>
    ['AWS', 'Docker'].filter((term) =>
      new RegExp(`(?:tell me about|describe|when|your experience)[^?]{0,100}\\b${term}\\b`, 'i').test(question.question)
    ).map((term) => `${question.question} [${term}]`)
  );
  const unsupportedFeedbackClaims = ['concurrent requests', 'race conditions']
    .filter((phrase) => feedback.exampleAnswer.toLowerCase().includes(phrase));
  const displayedExampleAnswer = buildGroundedExampleAnswer(answer);

  console.log(JSON.stringify({
    provider: provider.providerName,
    model: provider.providerVersion,
    questionLatencyMs,
    feedbackLatencyMs,
    questionCount: result.questions.length,
    questionTypes: types,
    resumeSpecificUnsupportedTerms: [...new Set(resumeSpecificUnsupportedTerms)],
    unsupportedExperienceAssumptions,
    unsupportedFeedbackClaims,
    questions: result.questions,
    sampleAnswer: answer,
    feedback,
    displayedExampleAnswer,
    providerExampleShownToUser: false,
    reviewRequired: 'Confirm relevance, factual grounding, rubric calibration, and example-answer quality manually.',
  }, null, 2));

  if (result.questions.length < 6 || Object.values(types).some((count) => count < 2)
    || resumeSpecificUnsupportedTerms.length || unsupportedExperienceAssumptions.length || unsupportedFeedbackClaims.length) {
    process.exitCode = 1;
  }
};

void run().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Interview evaluation failed.');
  process.exitCode = 1;
});
