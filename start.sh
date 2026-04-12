#!/bin/bash
set -e

echo "[STARTUP] Starting JudgeTracker backend on port 3001..."
node server/index.js &
BACKEND_PID=$!
echo "[STARTUP] Backend PID: $BACKEND_PID"

# Wait for backend to be ready
for i in $(seq 1 15); do
  if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo "[STARTUP] Backend is ready."
    break
  fi
  sleep 1
done

echo "[STARTUP] Starting React frontend on port 5000..."
PORT=5000 HOST=0.0.0.0 npm start

# If React exits, kill backend too
kill $BACKEND_PID 2>/dev/null || true
