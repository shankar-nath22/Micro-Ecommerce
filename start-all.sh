#!/bin/bash

##############################################
#  MICRO-ECOM STARTER SCRIPT (macOS/Linux)
##############################################

ROOT_DIR=$(pwd)

echo "🚀 Loading environment variables..."
if [ ! -f ".env/global.env" ]; then
  echo "❌ ERROR: .env/global.env file not found."
  exit 1
fi

set -a
source .env/global.env
set +a

echo "🌱 ENV Loaded:"
echo "  PORT_AUTH=$PORT_AUTH"
echo "  PORT_PRODUCT=$PORT_PRODUCT"
echo "  PORT_CART=$PORT_CART"
echo "  PORT_ORDER=$PORT_ORDER"
echo "  PORT_GATEWAY=$PORT_GATEWAY"
echo "  JWT_SECRET=${JWT_SECRET:0:8}********"


##############################################
# Function to start a service in a new terminal
##############################################

start_service() {
  NAME=$1
  DIR=$2

  echo "🚀 Starting $NAME service..."

  osascript <<EOF
tell application "Terminal"
    do script "cd $ROOT_DIR/$DIR && ./mvnw spring-boot:run"
    activate
end tell
EOF
}

start_node_service() {
  NAME=$1
  DIR=$2

  echo "🚀 Starting $NAME service..."

  osascript <<EOF
tell application "Terminal"
    do script "cd $ROOT_DIR/$DIR && node index.js"
    activate
end tell
EOF
}

start_go_service() {
  NAME=$1
  DIR=$2

  echo "🚀 Starting $NAME service..."

  osascript <<EOF
tell application "Terminal"
    do script "cd $ROOT_DIR/$DIR && go run main.go"
    activate
end tell
EOF
}


##############################################
# START SERVICES
##############################################

start_service "Auth" "auth-service"
start_service "Product" "product-service"
start_node_service "Cart" "cart-service"
start_go_service "Order" "order-service"
start_service "API Gateway" "api-gateway"

echo ""
echo "🔥🔥🔥 ALL SERVICES ARE STARTING IN SEPARATE TERMINALS 🔥🔥🔥"
echo ""
echo "➡ Test API-Gateway: curl http://localhost:$PORT_GATEWAY/products"
echo "➡ Check auth:       curl http://localhost:$PORT_GATEWAY/auth/login"
echo ""
