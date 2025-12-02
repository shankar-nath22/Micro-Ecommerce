#!/bin/bash

##############################################
#  MICRO-ECOM STOP SCRIPT (macOS/Linux)
##############################################

ROOT_DIR=$(pwd)

echo "🛑 Stopping all micro-ecom services..."

# Load environment variables
if [ ! -f ".env/global.env" ]; then
  echo "❌ ERROR: .env/global.env file not found."
  exit 1
fi

set -a
source .env/global.env
set +a

PORTS=(
  $PORT_AUTH
  $PORT_PRODUCT
  $PORT_CART
  $PORT_ORDER
  $PORT_GATEWAY
)

echo "🔍 Stopping processes on ports:"
printf "  %s\n" "${PORTS[@]}"

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -t -i:$PORT)

  if [ -n "$PID" ]; then
    echo "🛑 Killing process on port $PORT (PID: $PID)"
    kill -9 $PID 2>/dev/null
  else
    echo "✔ No process running on port $PORT"
  fi
done

echo ""
echo "✨ All services stopped successfully."
