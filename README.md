# Micro-Ecom Project

This is a microservices-based e-commerce platform built with a polyglot architecture (Java/Spring Boot, Go, Node.js) and orchestrated with Docker.

## Project Structure

- **api-gateway**: Spring Cloud Gateway for routing requests.
- **auth-service**: Spring Boot service for authentication and JWT management.
- **product-service**: Spring Boot service for managing products (MongoDB).
- **cart-service**: Node.js service for cart management (Redis).
- **order-service**: Go service for order processing (PostgreSQL).
- **payment-service**: Go service for payment processing (PostgreSQL).
- **inventory-service**: Spring Boot service for inventory management (MongoDB).
- **notification-service**: Kafka-based notification consumer.
- **frontend**: React-based frontend application (Vite).

## Prerequisites

- **Docker & Docker Compose**
- **Java 17+** (for local development)
- **Go 1.20+** (for local development)
- **Node.js 18+** (for local development)
- **Maven** (for local development)

## Setup

1. **Environment Variables**:
   Ensure the `.env/global.env` file exists with the following configuration:
   ```env
   JWT_SECRET="your_secret_here"
   AUTH_URL=http://localhost:8081
   PRODUCT_URL=http://localhost:8082
   # ... other service URLs
   ```

2. **Infrastructure**:
   The project uses PostgreSQL, MongoDB, Redis, and Kafka. These are managed via Docker Compose.

## How to Run

### Option 1: Docker Compose (Recommended)

This will build and start all services and their dependencies.

```bash
docker compose up --build
```

- **API Gateway**: `http://localhost:8080`
- **Frontend**: `http://localhost:5173` (once started)

### Option 2: Local Execution (Scripts)

1. **Start Infrastructure**:
   ```bash
   docker compose up -d auth-db order-db payment-db mongo inventory-mongo redis zookeeper kafka
   ```

2. **Start Backend Services**:
   Use the provided helper script:
   ```bash
   ./start-all.sh
   ```
   *Note: This script opens new terminal windows on macOS to start services.*

3. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Key Endpoints

- **Products**: `GET http://localhost:8080/products`
- **Auth**: `POST http://localhost:8080/auth/login`
- **Orders**: `POST http://localhost:8080/orders`
