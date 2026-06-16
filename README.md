# Personal Inventory Management System (IMS)

Welcome to your **Personal Inventory Management System (IMS)**, a lightweight, locally run desktop application designed to track physical items, group them into categories, and track where they belong using physical location mapping.

The project features a premium glassmorphic light-theme React Web UI, a high-performance Python API service, and a strict SQL database schema with automated event logging.

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
├── AGENTS.md               # AI Instructions, agent role boundaries, and coding styles
├── README.md               # This file (overview and manual links)
├── scripts/                # Dev convenience startup and test scripts
│   ├── start_dev.sh        # Starts backend and frontend dev servers concurrently
│   └── run_tests.sh        # Runs API integration tests
├── frontend/               # React client web application (Vite on port 3000)
│   ├── package.json        # Frontend configuration and dependencies
│   ├── vite.config.js      # Vite dev server options
│   ├── index.html          # HTML Template shell
│   └── src/                # React components & styles
│       ├── main.jsx        # Mounting point
│       ├── App.jsx         # React application file
│       └── index.css       # Premium Light Theme glassmorphic styles
├── backend/                # FastAPI backend API service (Uvicorn on port 8000)
│   ├── requirements.txt    # Python package dependencies
│   ├── main.py             # FastAPI entry point
│   ├── database/           # SQLite schema and migration utilities
│   │   ├── db.py           # SQLite connection pools and initializer
│   │   └── schema.sql      # Strict SQLite database DDL
│   └── tests/              # Backend testing suite
│       └── test_main.py    # Automated integration API tests
└── docs/                   # Developer documentation files
    ├── running.md          # Setup and execution guide
    ├── datamodel.md        # Database schema constraints guide
    ├── tools.md            # Tooling and stack information
    └── testing.md          # Automated and manual testing guide
```

---

## ⚡ Quick Start

To boot up the inventory system immediately:

1. **Activate Virtual Environment and Install Backend Packages**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Launch the Services Concurrently**:
   Run the dev script from the project root:
   ```bash
   bash scripts/start_dev.sh
   ```

4. **Open the App**:
   Navigate to [http://localhost:3000/](http://localhost:3000/) in your browser. The React client will automatically communicate with the FastAPI backend on [http://localhost:8000/](http://localhost:8000/).
