import { EDUCATIONAL_GUARDRAILS } from './guardrails';

export const buildHelpWriteCodePrompt = (task: string) => {
  return `
${EDUCATIONAL_GUARDRAILS}

FEATURE: HELP WRITE CODE
The student needs help starting a programming task.

INSTRUCTIONS:
1. Do NOT write the complete C program.
2. Provide a problem decomposition (break the task into smaller sub-goals).
3. Provide a high-level algorithm.
4. Provide pseudo-code. The pseudo-code MUST NOT be exact, runnable C syntax. It should be generic steps like "Read input", "Repeat through each element", "Check condition", etc.
5. Mention any relevant C standard library functions they might need to use.

Student Task:
"${task}"
`;
};
