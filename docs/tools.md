# Developer Tooling Stack Guide

This document lists and details all languages, runtimes, frameworks, styling tools, validation systems, and test execution binaries used in the Inventory Management System.

---

## 1. System Runtimes

- **Python 3.14+**: The primary runtime engine executing the FastAPI backend service and test suites. Chosen for its speed, simplicity, and robust standard library database connections.
- **Node.js & npm (v25.6.1 / v11.9.0)**: Used as helper platforms for running local validation CLI tools and spawning browser subagents to automate UI testing.

---

## 2. Backend Tech Stack

- **FastAPI**: A modern, high-performance web framework for building APIs with Python. Utilized for its fast execution, auto-generated interactive OpenAPI/Swagger documentation, and native async lifespan support.
- **Uvicorn**: A lightning-fast ASGI web server implementation for Python. Serves as the web server hosting both API routes and static frontend files locally.
- **Pydantic (v2)**: Enforces strict data validation on incoming REST request bodies. Automatically checks data formats (min/max lengths, non-negative quantities, date formats) before queries touch the database.
- **sqlite3**: Python's native built-in library for interacting with SQLite databases. Avoids large, heavy ORM dependencies and ensures rapid, direct SQL execution.

---

## 3. Frontend Stack (React & Vite)

The UI client is built using **React** and bundled via **Vite** to provide a fast, reactive single-page dashboard.

- **Vite (v6)**: Performs fast hot-module-replacement (HMR) during development and compiles optimized production code assets. Configured to serve the web pages on port `3000`.
- **React (v19)**: Orchestrates reactive rendering, lifecycle state variables (for items, categories, physical locations, and logs), and dynamic filtering.
- **HTML5**: Native semantic hooks inside React JSX structures, utilizing React refs to trigger HTML5 `<dialog>` elements.
- **Premium Light Theme (Vanilla CSS)**:
  - **HSL Color Systems**: Ambient styling custom properties defining backgrounds (`hsl(220, 20%, 97%)`) and color overlays.
  - **Translucent White Glass**: Containers styled using `rgba(255, 255, 255, 0.7)` and `backdrop-filter: blur(20px)` to provide visual depth.
  - **Soft Drop Shadows**: Minimal borders combined with low-opacity dark shadows for a premium physical card look.
  - **discrete animations**: Fade-ins and slide reveals managed natively via `@starting-style` and `transition-behavior: allow-discrete` transitions.
- **Async Fetch Client**: Performs HTTP calls to the backend microservice absolute URL (`http://127.0.0.1:8000/api/v1`) using native async/await.

---

## 4. Verification & Testing Tools

- **Python Unittest Framework**: Standard library unittest suite runner facilitating test assertions, database setup fixtures (`setUpClass`), and teardown cleanup routines.
- **FastAPI TestClient**: Simulated API request engine leveraging `starlette.testclient` to inspect server routes and responses without executing a network sockets connection.
- **HTTPX**: The underlying HTTP transport driver used by TestClient to execute mock network requests.
- **Playwright / Chromium**: The underlying browser automation tool used by the Antigravity `browser_subagent` to render the Web UI, simulate button clicks, fill dialog inputs, and record session logs.
- **Curl**: Command-line HTTP utility used for swift API response diagnostics and endpoint health checks.
