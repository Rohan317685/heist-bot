#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Starting Heist Support Bot..."
npx tsx src/index.ts &
BOT_PID=$!
sleep 2

echo "Starting Cloudflare Tunnel..."
cloudflared tunnel --url http://localhost:3000 2>&1 | while read line; do
  echo "$line"
  echo "$line" | grep -q "trycloudflare.com" && echo ">>> PUBLIC URL ABOVE <<<"
done &
TUNNEL_PID=$!

echo "Bot PID: $BOT_PID | Tunnel PID: $TUNNEL_PID"
echo "Press Ctrl+C to stop both"

trap "kill $BOT_PID $TUNNEL_PID 2>/dev/null; exit" INT TERM
wait
