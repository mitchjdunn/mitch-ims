# How to Run the Inventory Management System

This document outlines the step-by-step instructions to set up, launch, and test the personal Inventory Management System (IMS) on a local machine.

---

## 1. Prerequisites

Before starting, ensure your system has the following runtimes installed:
- **Python 3.14+**
- **pip** (Python package installer)
- **Web Browser** (Google Chrome, Safari, Firefox, or Edge)

---

## 2. Environment Setup & Dependencies

The backend service runs inside a isolated Python virtual environment (`.venv`) to ensure dependencies do not conflict with system-level packages.

1. **Clone or navigate to the workspace root**:
   ```bash
   cd /Users/mitch/projects/ims
   ```
2. **Create the Python virtual environment**:
   ```bash
   python3 -m venv .venv
   ```
3. **Activate the virtual environment**:
   - On macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
   - On Windows:
     ```cmd
     .venv\Scripts\activate.bat
     ```
4. **Install Python packages**:
   ```bash
   pip install -r backend/requirements.txt
   ```

---

## 3. Starting the Dev Microservices

The backend and frontend are hosted as independent, decoupled microservices for development:
- **Backend API**: Python FastAPI application running on port `8000`.
- **Frontend Web UI**: React & Vite dev server running on port `3000`.

You can spin up both services concurrently using the dev script at the root:
```bash
bash scripts/start_dev.sh
```

Alternatively, you can run them manually in separate terminal tabs:

### A. Run Backend API (Port 8000)
1. Activate virtual environment: `source .venv/bin/activate`
2. Run Uvicorn: `cd backend && uvicorn main:app --reload --port 8000`

### B. Run Frontend UI (Port 3000)
1. Install dependencies (if first time): `cd frontend && npm install`
2. Run Vite: `npm run dev`

### C. Open the Application
Navigate to [http://localhost:3000/](http://localhost:3000/) in your browser. (Since the frontend communicates with the backend via CORS, all database actions will save correctly).

---

## 4. Database Setup & Seeding

**No manual database setup is required!**
On server boot, the FastAPI application's startup lifespan checks if the SQLite database file `backend/inventory.db` exists. If it does not, it automatically runs:
1. `backend/database/schema.sql` to initialize all DDL structures (Items, Categories, Locations, Logs).
2. Seeds default categories (e.g. *Electronics*, *Tools*, *Kitchenware*) and physical locations (e.g. *Garage Workbench*, *Kitchen Pantry*) so the application is ready to use immediately.

If you ever wish to reset the database back to clean seeded defaults, simply delete the `inventory.db` file from the `backend/` directory and restart the server:
```bash
rm backend/inventory.db
bash scripts/start_dev.sh
```

---

## 5. Running API Integration Tests

To run the automated suite that validates endpoint responses, uniqueness, checks constraints, and audit logs:

You can execute the tests using the script at the root:
```bash
bash scripts/run_tests.sh
```

Alternatively, you can run them manually:
1. **Activate the virtual environment**:
   ```bash
   source .venv/bin/activate
   ```
2. **Navigate to the backend directory and run Python's discovery tool**:
   ```bash
   cd backend
   python3 -m unittest discover -s tests
   ```

This spins up an isolated `backend/test_inventory.db` file, runs all test assertions, and cleans up the test database file automatically after completion.
