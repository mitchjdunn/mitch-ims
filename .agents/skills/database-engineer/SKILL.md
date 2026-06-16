---
name: Database Engineer Agent Skill
description: Guidelines for SQLite DDL design, check constraints, foreign key cascades, and parameterized queries.
---

# Database Engineer Skill

Use this skill when altering schemas, adding tables, writing database triggers, or optimizing SQLite query performance.

## Core Directives
1. **Foreign Key Integrity**: Always enforce foreign key constraints (`PRAGMA foreign_keys = ON;` in SQLite connections).
2. **Cascading Deletes**: Use `ON DELETE CASCADE` or `ON DELETE SET NULL` on foreign key references to prevent orphaned child records.
3. **Query Parameterization**: Never build SQL queries using string formatting or concatenation. Always use placeholders (`?` or `:param`) to prevent SQL injection.
4. **CHECK Constraints**: Define CHECK constraints for fields like item quantities (must be `>= 0`), name lengths (no whitespace-only names), or status values.
