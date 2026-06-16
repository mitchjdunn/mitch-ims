# Personal Inventory Management System (IMS)

Welcome to your **Personal Inventory Management System (IMS)**, a lightweight, locally run desktop application designed to track physical items, group them into categories, and track where they belong using physical location mapping.

The project features a premium glassmorphic dark-theme Web UI, a high-performance Python API service, and a strict SQL database schema with automated event logging.

---

## 📖 Project Documentation

We have established dedicated guides inside the `/docs/` folder for different aspects of the workspace:

1. **[How to Run](file:///Users/mitch/projects/ims/docs/running.md)**
   - Complete guides for environment initialization, activating virtual environments, launching the local API server, and executing automated test clients.
2. **[Data Model Design](file:///Users/mitch/projects/ims/docs/datamodel.md)**
   - Technical breakdown of the SQLite schema (Items, Categories, Locations, Logs), database triggers, foreign keys, spacing rules, and change audit trails.
3. **[Developer Tools Guide](file:///Users/mitch/projects/ims/docs/tools.md)**
   - Summary of languages, runtimes, dependencies, styling systems, and validation tools used to build the software engineering pipeline.
4. **[Testing Strategy & Test Cases](file:///Users/mitch/projects/ims/docs/testing.md)**
   - Detailed blueprint of unittest frameworks, integration mock clients, Playwright browser test coverage, and visual QA check routines.

---

## 🗂️ Workspace Layout

```
/
├── AGENTS.md               # AI Instructions, roles (Product Owner, Backend, QA, etc.)
├── README.md               # This file (overview and manual links)
├── requirements.txt        # Python pip dependencies
├── main.py                 # FastAPI backend application entry point
├── database/
│   ├── db.py               # Database connections, context managers, and seed utilities
│   └── schema.sql          # Strict SQLite DDL constraints and default categories/locations
├── public/                 # Web assets
│   ├── index.html          # Semantic page layout
│   ├── index.css           # Vanilla CSS theme and glassmorphic designs
│   └── app.js              # Client state sync, event dispatching, and REST requests
├── docs/                   # Developer documentation files
│   ├── running.md          # Setup and run manual
│   ├── datamodel.md        # Database constraint structures
│   ├── tools.md            # Detailed tooling stack list
│   └── testing.md          # Visual and unit test case checklist
└── tests/
    └── test_main.py        # Automated API integration tests
```

---

## ⚡ Quick Start

To boot up the inventory system immediately:

1. **Build virtual environment and install packages**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Launch the backend server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
3. **Open the App**:
   Go to [http://localhost:8000/](http://localhost:8000/) in your web browser.
