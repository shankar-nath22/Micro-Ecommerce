# 🛍️ Micro-Ecom Platform

A premium, production-ready, polyglot microservices e-commerce architecture. 
Features a **React** frontend with dark-mode glassmorphism styling, a high-performance **Go/Gin** processing layer, a robust **Java/Spring Boot** data layer, and event-driven communication via **Apache Kafka**.

---

## ✨ Key Features
- **Real-Time Order Tracking:** Uses WebSockets for instantaneous, live status updates on user and admin dashboards without page refreshes.
- **Admin Analytics Dashboard:** Powered by Recharts. Visualizes total revenue, sales categories, and low-stock alerts dynamically.
- **Secure Stripe Checkout:** Integrates Stripe Elements for a beautiful, secure payment processing flow (includes a mock-fallback mode for local testing).
- **Advanced Filtering & Search:** Client-side real-time multi-dimensional filtering across categories, price brackets, and stock availability.
- **Event-Driven Microservices:** Distributed messaging utilizing Apache Kafka and Zookeeper for decoupled system notifications and scaling.

---

## 🏗️ Architecture Stack
### Frontend
* **Framework:** React 18, Vite, TypeScript
* **State Management:** Zustand
* **Routing & UI:** React Router, Lucide Icons, Recharts, SweetAlert2, Hot Toast
* **Styling:** Custom CSS, Premium Dark/Light Glassmorphism Theme

### Backend (Polyglot)
* **Java Services (Spring Boot, Spring Cloud Gateway):**
  * `api-gateway` (Port 8080)
  * `auth-service` (Port 8081)
  * `product-service` (Port 8082)
  * `inventory-service` (Port 8086)
* **Go Services (Gin, GORM, WebSockets):**
  * `order-service` (Port 8084)
  * `payment-service` (Port 8085)
* **Node.js Services (Express):**
  * `cart-service` (Port 8083)

### Infrastructure & Data
* **Databases:** PostgreSQL (Relational), MongoDB (Document)
* **Caching:** Redis
* **Message Broker:** Apache Kafka & Zookeeper
* **Containerization:** Docker & Docker Compose

---

## 🚀 Getting Started

### 1. Configure the Environment
Copy the `.env.example` file to create your local `.env` configuration file:
```bash
cp .env.example .env
```
Inside the `.env` file, configure your secrets (DB passwords, JWT keys, Stripe variables) to secure your local instances.

### 2. Launch the Cluster
This project is fully containerized. To build and start all microservices, databases, and message brokers, run:
```bash
docker compose up -d --build
```
*Note: The initial start may take several minutes as it provisions Kafka, Zookeeper, Redis, PostgreSQL, MongoDB, and builds all 9 backend service containers.*

### 3. Access the Application
- **Frontend Dashboard:** `http://localhost:5173` (requires starting the frontend manually if not Dockerized, via `cd frontend && npm run dev`)
- **API Gateway:** `http://localhost:8080`

### 4. Stopping the Cluster
To gracefully stop all services without losing your database volumes:
```bash
docker compose down
```
To bring down the cluster and wipe databases, use `docker compose down -v`.

---

## 📚 API Endpoints Overview
All requests should be routed through the `api-gateway` on port `8080`.

| Method | Route | Description | Service Target |
|--------|-------|-------------|----------------|
| POST | `/auth/login` | Authenticate user & get JWT | `auth-service` |
| GET | `/products` | Fetch product catalog | `product-service` |
| GET | `/cart` | Fetch user's cart | `cart-service` |
| POST | `/orders` | Submit cart for checkout | `order-service` |
| GET | `/orders/ws` | WebSocket order updates | `order-service` |

---
*Built with ❤️ utilizing Advanced Agentic Coding.*
