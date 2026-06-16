---
name: QA & Verification Agent Skill
description: Guidelines for writing unittest frameworks, integration mock clients, and browser end-to-end checklist validations.
---

# QA & Verification Skill

Use this skill when adding test cases, running test runner scripts, or writing E2E checklists.

## Core Directives
1. **Isolated Testing Database**: Ensure all integration tests execute using a separate, temporary test database file (`test_inventory.db`) to avoid modifying developer storage.
2. **Assertive Coverage**: Cover edge cases, check constraints, schema validations, and negative quantities.
3. **Automated Discovery**: Run tests using standard python unittest discovery via `bash scripts/run_tests.sh`.
