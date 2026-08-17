# API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication

All protected routes require a JWT token in the `Authorization` header:
`Authorization: Bearer <token>`

### POST `/auth/register`
- **Purpose**: Register a new user.
- **Body**: `{ "username": "user1", "password": "password123" }`
- **Response**: `{ "token": "jwt_token_here", "user": { "id": "...", "username": "user1" } }`

### POST `/auth/login`
- **Purpose**: Login an existing user.
- **Body**: `{ "username": "user1", "password": "password123" }`
- **Response**: `{ "token": "jwt_token_here", "user": { "id": "...", "username": "user1" } }`

## CodeAid Features

### POST `/chat/general` (Streaming)
- **Purpose**: Answer general programming questions.
- **Body**:
  ```json
  {
    "question": "What is a pointer in C?",
    "conversationHistory": [
      { "role": "user", "content": "Previous question..." },
      { "role": "assistant", "content": "Previous answer..." }
    ]
  }
  ```
- **Response**: Server-Sent Events (SSE) stream of text.

### POST `/chat/question-from-code` (Streaming)
- **Purpose**: Answer questions about specific code.
- **Body**:
  ```json
  {
    "code": "int main() { ... }",
    "question": "Why is this crashing?",
    "conversationHistory": []
  }
  ```
- **Response**: SSE stream.

### POST `/chat/help-fix-code`
- **Purpose**: Analyze buggy code and provide inline explanations of fixes.
- **Body**:
  ```json
  {
    "buggyCode": "int main() { printf(\"Hello) }",
    "errorOrIntention": "Missing quote"
  }
  ```
- **Response**: JSON containing the annotations and explanations.

### POST `/chat/explain-code`
- **Purpose**: Provide line-by-line explanation of code.
- **Body**:
  ```json
  {
    "code": "int x = 5;"
  }
  ```
- **Response**: JSON mapping line numbers to explanations.

### POST `/chat/help-write-code` (Streaming)
- **Purpose**: Provide algorithmic steps and pseudocode for a task.
- **Body**:
  ```json
  {
    "task": "Find max value in array"
  }
  ```
- **Response**: SSE stream.

## Feedback

### POST `/feedback`
- **Purpose**: Submit user rating and feedback for an AI response.
- **Body**:
  ```json
  {
    "feature": "general",
    "question": "What is a pointer?",
    "response": "A pointer is...",
    "rating": 5,
    "feedbackText": "Very helpful!"
  }
  ```
- **Response**: `{ "success": true }`
