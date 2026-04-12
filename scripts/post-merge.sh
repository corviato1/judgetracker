#!/bin/bash
set -e

echo "[POST-MERGE] Installing dependencies..."
npm install --no-audit --no-fund

echo "[POST-MERGE] Running database migrations..."
node server/scripts/migrate.js

echo "[POST-MERGE] Done."
