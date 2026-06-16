#!/bin/bash
# Run the integration test suite

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Running API Integration Test Suite ==="
cd "$PROJECT_ROOT"

if [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
else
    echo "WARNING: .venv folder not found at project root."
fi

# Switch to backend directory and run test suite discovery
cd backend
python3 -m unittest discover -s tests
