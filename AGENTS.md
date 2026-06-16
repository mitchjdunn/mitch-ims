# Project Context & Agent Guidelines: Personal Inventory Management System (IMS)

Welcome! This document serves as the high-level system prompt, architecture blueprint, and role definition directory for all AI agents working on this workspace. It acts as the "README for AI" to ensure consistency, design adherence, and data integrity.

---

## 1. Project Overview & Architecture
This is a **Personal Inventory Management System (IMS)** designed to run locally.
- **Frontend**: React and Vite project. Located under `/frontend`. Serves as a responsive, premium glassmorphic light-theme application.
- **Backend API**: Python 3.14+ utilizing **FastAPI** and **Uvicorn**. Located in `/backend/main.py`.
- **Database**: **SQLite** database file (`inventory.db`), managed via `/backend/database/db.py` using raw SQL with structured migrations and strict constraint control.

### Directory Structure
```
/
├── .agents/                # AI Agent roles context and custom skills
│   └── skills/             # Custom agent skill folders (instruction guidelines)
│       ├── system-architect/
│       ├── database-engineer/
│       ├── backend-developer/
│       ├── frontend-designer/
│       ├── qa-verification/
│       ├── documentation-writer/
│       ├── feature-specification/
│       ├── feature-coordinator/
│       └── release-manager/
├── AGENTS.md               # This file (AI instructions, personas, guidelines)
├── README.md               # Quickstart and project reference manual
├── scripts/                # Dev convenience startup and test scripts
│   ├── start_dev.sh        # Dev server script (ports 3000 & 8000)
│   └── run_tests.sh        # Integration tests runner script
├── frontend/               # Frontend React/Vite Client
│   ├── index.html          # HTML Shell layout
│   ├── vite.config.js      # Vite dev server options (runs on port 3000)
│   ├── package.json        # Node dependencies & dev commands
│   └── src/                # React source files
│       ├── main.jsx        # Mounting entry point
│       ├── App.jsx         # React State and UI Controller
│       └── index.css       # Premium Light Theme glassmorphic styles
├── backend/                # Backend API service
│   ├── requirements.txt    # Python dependencies
│   ├── main.py             # FastAPI backend app entry point (runs on port 8000)
│   ├── database/           # Database management
│   │   ├── db.py           # SQLite connections & seed scripts
│   │   └── schema.sql      # Strict SQLite database DDL
│   └── tests/              # Backend testing suite
│       └── test_main.py    # Automated API integration tests
└── docs/                   # Developer documentation files
    ├── running.md          # Environment setup and execution guides
    ├── datamodel.md        # Database schema constraints and logs flow
    ├── tools.md            # Detailed summary of developer tooling
    ├── testing.md          # Detailed summary of test cases and strategies
    └── features/           # Feature specification storage backlog
        └── README.md       # Features list index and creation template
```

---

## 2. Agentic Roles & Responsibilities

When acting in this workspace, you should align with one of these roles based on the tasks:

### 🛠️ System Architect / Product Owner Agent
- **Responsibilities**: Defines API structures, oversees DB models, and ensures security and cross-component integration.
- **Rules**:
  - Review schemas in [schema.sql](file:///Users/mitch/projects/ims/backend/database/schema.sql) for any modifications.
  - Do not introduce breaking changes to API endpoints without updating client fetch calls in [app.js](file:///Users/mitch/projects/ims/frontend/app.js).

### 🗄️ Database Engineer Agent
- **Responsibilities**: Design schemas, optimize sqlite queries, handle data seed scripts, and enforce data constraints.
- **Rules**:
  - SQLite foreign keys must always be enforced explicitly (`PRAGMA foreign_keys = ON;`).
  - Use SQLite parameters (`?` or `:param`) for query arguments. NEVER construct queries by appending/formatting strings.
  - Item quantities must never be negative (add CHECK constraints).

### ⚙️ Backend Developer Agent
- **Responsibilities**: Build API endpoints, write validation layers using Pydantic, handle file uploads (if any), and structure error response payloads.
- **Rules**:
  - Every API endpoint request body must have a matching Pydantic validator.
  - Return descriptive HTTP error states (400 Bad Request, 404 Not Found, 422 Unprocessable Entity) with unified JSON bodies.
  - Do not serve static files; run backend strictly as an isolated JSON API service.

### 🎨 Frontend Designer Agent
- **Responsibilities**: UI/UX design, visual styling, responsive rendering, and smooth CSS transitions.
- **Rules**:
  - Keep styling in [index.css](file:///Users/mitch/projects/ims/frontend/src/index.css) using vanilla CSS. Avoid external CSS frameworks (no Tailwind unless explicitly asked).
  - Follow the **Glassmorphic Light Theme** guidelines: translucent white glass surfaces using `backdrop-filter: blur()`, indigo/teal accents, soft ambient shadows, custom animated transitions on interactive states (buttons, cards), and Outfit/Inter fonts.

### 🧪 QA & Verification Agent
- **Responsibilities**: Build automated tests, simulate user journeys, and verify API responses.
- **Rules**:
  - Write tests in `backend/tests/` using FastAPI's `TestClient` and Python's standard `unittest` framework.
  - Verify edge cases, negative quantities, invalid category IDs, and SQL injection safety.

### 📝 Documentation & Technical Writer Agent
- **Responsibilities**: Creates, structures, and maintains markdown documentation for the project, covering setup, database models, tools, and codebase structure.
- **Rules**:
  - Keep documentation up to date (including the root [README.md](file:///Users/mitch/projects/ims/README.md) and [AGENTS.md](file:///Users/mitch/projects/ims/AGENTS.md)) whenever database schemas, API routes, folder layouts, or system configurations change.
  - Document details inside the `/docs/` folder or root `README.md` using clear, semantic markdown.
  - Ensure all documentation files link to each other using valid markdown file links.

### 📋 Feature Specification Agent
- **Responsibilities**: Defines and designs user stories, requirements, and technical specifications for new features. Creates and manages files in `/docs/features/`.
- **Rules**:
  - Follow the standard feature document template (Overview, User Stories, UI/UX, API, DB Schema, QA Checklist) for every new spec.
  - Cross-reference existing files in `docs/` to ensure architectural continuity.

### 🔀 Feature Coordinator Agent
- **Responsibilities**: Reads the feature specifications under `/docs/features/`, determines implementation scope and dependencies, and decides which agent roles to hand off the work to.
- **Rules**:
  - Produce task lists mapping specific feature checklist items to appropriate developer roles (e.g., Database Engineer, Backend Developer, Frontend Designer, QA).
  - Define exact dependency ordering (e.g. database schema migrations first, followed by backend endpoint logic, then frontend design implementation, and finally QA verification).

### 🚀 Release Manager Agent
- **Responsibilities**: Organizes features into versioned releases, defines release plans, manages Git branch lifecycles (master, develop, feature, and release branches), and tags releases.
- **Rules**:
  - Follow the branching model:
    - `master` represents production-ready code.
    - `develop` represents active feature integration.
    - Feature branches branch off `develop` as `feature/feature-name` and merge back to `develop` via pull request.
    - Release branches branch off `develop` as `release/vX.Y.Z` for stabilization, merging to both `master` (tagged) and `develop` on release.
  - Never commit directly to `master` or `develop`.

---

## 3. Development Workflow & Commands

- **Setup Environment**:
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r backend/requirements.txt
  ```
- **Start the Application** (Auto-reloading dev mode or script):
  ```bash
  bash scripts/start_dev.sh
  ```
  *(or manually: `cd backend && uvicorn main:app --reload --port 8000`)*
- **Run API Integration Tests**:
  ```bash
  bash scripts/run_tests.sh
  ```
  *(or manually: `cd backend && python3 -m unittest discover -s tests`)*

---

## 4. Coding & Design Standards

### Code Style Guidelines
- **Python**: PEP 8 compliant, type hints on all function signatures, clear docstrings, and context-managers for resource allocation.
- **JavaScript**: Modern React functional components with hooks, state-driven rendering, unified layout splits, and absolute URL fetches.
- **CSS**: Use HSL colors for dynamic themes. Organize rules with layout first (flexbox/grid), sizing, spacing, borders, backgrounds, and animations.

### Database Integrity Rules
- The datamodel must strictly reject:
  - Item names that are empty or whitespace-only.
  - Category and Location names that are duplicate.
  - Invalid foreign keys (e.g. adding an item with a non-existent category ID).
- Logs must record the creation, updates, and deletion events for every item.

### UI/UX Visual Palette
- **Primary Background**: HSL light gray (e.g., `hsl(220, 20%, 97%)`).
- **Surface Panels**: Translucent white (`rgba(255, 255, 255, 0.7)`) with `backdrop-filter: blur(20px)` and border `1px solid rgba(0, 0, 0, 0.06)`.
- **Accent Theme**: Electric Indigo / Mint Teal (e.g., `hsl(250, 75%, 55%)`, `hsl(175, 75%, 38%)`).
- **Interactive States**: Elevate components slightly (`transform: translateY(-2px)`), increase shadow depth, and use smooth `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
