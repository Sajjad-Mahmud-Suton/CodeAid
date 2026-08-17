# Paper Component Mapping

This document maps the components described in the CodeAid paper to their implementation in this project.

| Paper Component | Paper Description | Our Implementation | File/Module | Status |
| :--- | :--- | :--- | :--- | :--- |
| **General Question** | Answers conceptual C questions without full code. | Prompt-engineered LLM call via `/api/chat/general`. | `backend/prompts/general.ts`, `backend/routes/chat.ts` | Implementing |
| **Question from Code** | Analyzes student code to answer specific questions. | LLM prompt incorporating student code. | `backend/prompts/questionFromCode.ts` | Implementing |
| **Help Fix Code** | Explains bugs and suggests fixes without giving full corrected code. | Code diffing algorithm comparing original vs internally LLM-corrected code, with line-by-line annotations. | `backend/services/fixCodeService.ts`, `backend/prompts/fixCode.ts` | Implementing |
| **Explain Code** | Generates line-by-line explanations of C code. | LLM prompt returning a JSON mapping of line numbers to explanations. | `backend/prompts/explainCode.ts` | Implementing |
| **Help Write Code** | Provides algorithm/pseudocode steps for a given task. | LLM prompt that decomposes tasks into high-level steps. | `backend/prompts/helpWriteCode.ts` | Implementing |
| **Function Documentation**| Local lookup for common C standard library functions. | Statically defined database of functions avoiding LLM hallucination. | `backend/services/docService.ts` | Implementing |
| **Educational Guardrails**| Prevents LLM from giving direct solutions to students. | Prompt instructions prioritizing pedagogy and refusing bypass attempts. | `backend/prompts/guardrails.ts` | Implementing |
| **Streaming Output** | Progressive generation of responses for better UX. | Server-Sent Events (SSE) from Express backend to React frontend. | `backend/routes/chat.ts` | Implementing |
| **Follow-up Questions** | Chat interface that maintains conversation history. | Frontend sends conversation history array to backend. | `frontend/src/components/Chat/` | Implementing |
| **Rating / Feedback** | 1-5 scale and optional text feedback on AI responses. | MongoDB collection for interactions. | `backend/models/Feedback.ts` | Implementing |
| **Dataset Analysis** | Analysis of student queries from the HuggingFace dataset. | Python script with TF-IDF, Logistic Regression, Naive Bayes. | `ml/scripts/`, `ml/notebooks/` | Implementing |
