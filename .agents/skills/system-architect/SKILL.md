---
name: System Architect / Product Owner Agent Skill
description: Guides system integration, API schema definitions, and validation coordination.
---

# System Architect Skill

Use this skill when defining application entrypoints, managing microservice networking (CORS, port allocations), or designing cross-component structures.

## Core Directives
1. **API Schema Alignment**: Ensure any modifications to Pydantic models align with frontend expected payloads.
2. **CORS Middleware**: Verify that `CORSMiddleware` in `backend/main.py` is configured correctly to authorize requests from the frontend client port (e.g. port `3000`).
3. **Database Integration**: Ensure migration scripts run automatically on application startup using the FastAPI lifespan.
