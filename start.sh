#!/bin/bash
set -e

echo "[STARTUP] Running database migrations..."
node server/scripts/migrate.js

echo "[STARTUP] Starting JudgeTracker backend on port 3001..."
node server/index.js &
BACKEND_PID=$!
echo "[STARTUP] Backend PID: $BACKEND_PID"

for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:3001/health > /dev/null 2>&1; then
    echo "[STARTUP] Backend is ready."
    break
  fi
  sleep 1
done

echo "[STARTUP] Starting React frontend on port 5000..."
PORT=5000 HOST=0.0.0.0 npm start

kill $BACKEND_PID 2>/dev/null || true
