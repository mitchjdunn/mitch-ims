#!/bin/bash
# Start both backend and frontend microservices concurrently

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Starting IMS Microservices ==="
cd "$PROJECT_ROOT"

if [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

# Cleanup background processes on exit
trap 'echo "Stopping microservices..."; kill $(jobs -p) 2>/dev/null; exit' SIGINT SIGTERM EXIT

# Start backend (API)
echo "Starting Backend API on http://localhost:8000..."
cd "$PROJECT_ROOT/backend"
uvicorn main:app --reload --port 8000 &

# Start frontend (React-Vite Server)
echo "Starting Frontend Web Server on http://localhost:3000..."
cd "$PROJECT_ROOT/frontend"
npm run dev &

# Wait for both child processes to exit
wait
