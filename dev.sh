#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "Starting bot + API..."
npx tsx src/index.ts &
BOT=$!
sleep 2

echo "Starting Svelte frontend..."
cd frontend
npm run dev &
FRONTEND=$!

echo "Bot: $BOT | Frontend: $FRONTEND"
echo "Dashboard: http://localhost:5173"
echo "API: http://localhost:3000"
echo "Ctrl+C to stop"

trap "kill $BOT $FRONTEND 2>/dev/null; exit" INT TERM
wait
