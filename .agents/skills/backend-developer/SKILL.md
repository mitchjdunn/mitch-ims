---
name: Backend Developer Agent Skill
description: Guidelines for writing FastAPI endpoints, Pydantic validations, and returning unified JSON error responses.
---

# Backend Developer Skill

Use this skill when writing API handlers, validating request payloads, and formatting JSON payloads in `backend/main.py`.

## Core Directives
1. **Pydantic Validation**: Implement a matching Pydantic schema with custom field validators for every POST/PUT request body.
2. **Error Responses**: Return descriptive HTTP status codes (e.g. `400 Bad Request`, `404 Not Found`, `409 Conflict`) with detailed JSON details via FastAPI's `HTTPException`.
3. **Clean Controller Separation**: Run the backend strictly as an isolated JSON API service without mounting or serving static HTML/JS files.
