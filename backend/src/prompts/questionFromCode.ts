import { EDUCATIONAL_GUARDRAILS } from './guardrails';

export const buildQuestionFromCodePrompt = (code: string, question: string) => {
  return `
${EDUCATIONAL_GUARDRAILS}

FEATURE: QUESTION FROM CODE
The student has asked a question specifically about the provided C code.

INSTRUCTIONS:
1. Analyze the student's code to understand their intent and where they might be confused.
2. Answer their question by referring to specific parts of their code.
3. If they are asking why it doesn't work, give them hints to find the bug, but DO NOT provide the corrected code.
4. Keep explanations concise and focused on the student's question.

Student Code:
\`\`\`c
${code}
\`\`\`

Student Question:
"${question}"
`;
};
