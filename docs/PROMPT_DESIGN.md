# Prompt Design

This document details the prompt engineering approach used to simulate the CodeAid features while enforcing strict educational guardrails.

## Educational Guardrails

The foundation of the prompts is a strict system instruction appended to all LLM calls. This guardrail ensures:
- The AI never provides direct, complete code solutions to the user's tasks.
- The AI provides conceptual explanations, hints, and algorithmic steps.
- The AI is resistant to common bypass attempts (e.g., "ignore previous instructions", "translate to another language").

## Feature Prompts

### 1. General Question
- **Purpose**: Answer general conceptual questions about C programming.
- **Inputs**: `question` (string), `conversationHistory` (array).
- **Expected Output**: Conceptual explanation with optional short inline snippets.

### 2. Question from Code
- **Purpose**: Answer questions related to a specific piece of student code.
- **Inputs**: `code` (string), `question` (string), `conversationHistory` (array).
- **Expected Output**: Conceptual explanation and hints pointing to issues or concepts in the provided code, without supplying the full corrected code.

### 3. Help Fix Code
- **Purpose**: Identify bugs and suggest fixes without revealing the complete corrected code.
- **Inputs**: `buggyCode` (string), `errorOrIntention` (string).
- **Process**:
  1. Internal prompt asks LLM to generate the fully corrected code internally (using JSON).
  2. The backend compares `buggyCode` and `correctedCode` to extract changed lines.
  3. A second LLM prompt generates an explanation for each changed block.
- **Expected Output**: Original code with visual annotations and associated explanations for necessary changes.

### 4. Explain Code
- **Purpose**: Provide line-by-line or block-by-block explanations of the provided code.
- **Inputs**: `code` (string).
- **Expected Output**: JSON object mapping line ranges/numbers to short explanatory strings.

### 5. Help Write Code
- **Purpose**: Help the student start writing code by breaking down the problem.
- **Inputs**: `task` (string).
- **Expected Output**: Problem decomposition, high-level steps, and pseudocode (which must NOT be exact C syntax).

## Function Extraction
The LLM is additionally prompted to identify any standard C library functions (e.g., `printf`, `malloc`) relevant to its response. These are returned alongside the main response to trigger the local Function Documentation panel.
