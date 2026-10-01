/**
 * The model may suggest a polished example containing plausible but unverified
 * details. The product never displays that text. This template can only repeat
 * the candidate's submitted answer and uses explicit placeholders everywhere
 * additional evidence is needed.
 */
export const buildGroundedExampleAnswer = (answer: string): string => {
  const submitted = answer.trim();
  return `Use this structure while keeping only facts you can verify:

Situation: [Briefly describe the verified context.]
Task: [State your verified responsibility or goal.]
Action: ${submitted}
Result: [Add a verified outcome or explain what you learned. Do not invent a metric.]`;
};
