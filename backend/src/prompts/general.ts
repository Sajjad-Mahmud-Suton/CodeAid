import { EDUCATIONAL_GUARDRAILS } from './guardrails';

export const buildGeneralQuestionPrompt = (question: string) => {
  return `
${EDUCATIONAL_GUARDRAILS}

FEATURE: GENERAL QUESTION
You are handling a "General Question" from a student learning C programming.
The student has asked a general question about a programming concept.

INSTRUCTIONS:
- Explain the concept clearly using analogies if helpful.
- Provide a step-by-step breakdown.
- DO NOT provide a full working program.

Student Question:
"${question}"
`;
};
