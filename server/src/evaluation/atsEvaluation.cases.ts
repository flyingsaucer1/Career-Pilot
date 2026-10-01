export interface ATSEvaluationCase {
  id: string;
  resumeText: string;
  jobDescription: string;
  expectedMatchingSkills: string[];
  expectedMissingSkills: string[];
}

/**
 * Synthetic, privacy-safe smoke cases. Replace or extend these with anonymized
 * examples that have been reviewed by a human before reporting benchmark data.
 */
export const atsEvaluationCases: ATSEvaluationCase[] = [
  {
    id: 'related-language-names',
    resumeText: 'Software developer with JavaScript and C experience. Built a JavaScript web application and wrote embedded C firmware. B.Sc. Computer Science.',
    jobDescription: 'Backend software engineer required to use Java and C++ for production services. JavaScript is a preferred additional skill. SQL database experience is required.',
    expectedMatchingSkills: ['JavaScript'],
    expectedMissingSkills: ['Java', 'C++', 'SQL'],
  },
  {
    id: 'frontend-intern',
    resumeText: `
      Computer Science student and full-stack developer.
      Built responsive React applications with TypeScript and Node.js.
      Created REST APIs backed by MongoDB and documented projects on GitHub.
    `,
    jobDescription: `
      We are hiring a frontend engineering intern with React, TypeScript and Node.js experience.
      Familiarity with Docker and AWS deployment is preferred. Candidates should understand REST APIs,
      Git workflows and responsive web development.
    `,
    expectedMatchingSkills: ['React', 'TypeScript', 'Node.js'],
    expectedMissingSkills: ['Docker', 'AWS'],
  },
  {
    id: 'machine-learning-intern',
    resumeText: `
      AI and machine-learning student experienced with Python, pandas and scikit-learn.
      Trained a classification model, evaluated precision and recall, and built a small Flask API.
    `,
    jobDescription: `
      Machine-learning intern needed to develop models using Python and PyTorch.
      The role requires SQL, data preprocessing, model evaluation and deployment on AWS.
    `,
    expectedMatchingSkills: ['Python'],
    expectedMissingSkills: ['PyTorch', 'SQL', 'AWS'],
  },
];
