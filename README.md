# FintechPlus: Distributed Microservices Platform 🚀🏦

FintechPlus is a high-performance, enterprise-grade fintech ecosystem built on a **Distributed Microservices Architecture**. It handles complex financial operations like money transfers, real-time auditing, and secure authentication using industry-standard patterns.

---

## 🏗️ System Architecture

The platform is designed as a suite of decoupled services that communicate through a hybrid of synchronous and asynchronous patterns.

### 🧩 Core Services
1.  **API Gateway**: The central entry point. Handles JWT authentication, rate limiting, and proxies requests to internal services.
2.  **Auth Service**: Manages user identity, registration, and secure JWT issuance using **Argon2** hashing.
3.  **User Service**: Dedicated to profile management and high-performance user lookups via **gRPC**.
4.  **Wallet Service**: The financial engine. Implements **CQRS** for high-integrity ledger management and balance tracking.
5.  **Audit Service**: An event-driven logging system using **MongoDB** to track every sensitive action across the platform.
6.  **Notification Service**: Consumes Kafka events to trigger real-time user alerts (Webhooks/Email).

---

## 🛠️ Tech Stack & Concepts

### **Backend (NestJS Monorepo)**
-   **Framework**: [NestJS](https://nestjs.com/) (Modular, TypeScript-first).
-   **Service Discovery**: [Consul](https://www.consul.io/) for dynamic service registration and health monitoring.
-   **Communication**:
    -   **TCP**: Synchronous communication between Gateway and Services.
    -   **gRPC**: Ultra-fast, binary communication between Wallet and User services.
    -   **Kafka**: Asynchronous event streaming for distributed transactions.
-   **Databases**:
    -   **PostgreSQL**: Transactional data (Auth, Wallet, User).
    -   **MongoDB**: Flexible, high-volume audit logs.
    -   **Redis**: Distributed locking and caching.

### **Frontend (Next.js 15)**
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack).
-   **Styling**: Tailwind CSS + [Shadcn/UI](https://ui.shadcn.com/).
-   **State Management**: [TanStack Query](https://tanstack.com/query) (React Query) for robust API synchronization.
-   **Security**: Centralized Axios interceptors for JWT injection.

---

## ⚡ Key Engineering Patterns

### **1. Distributed Saga Pattern (Money Transfer)**
To ensure data consistency across services without a single monolithic database, we use the **Saga Pattern** via Kafka:
1.  **Wallet Service** initiates the transfer and locks funds.
2.  Emits a `transfer.initiated` event to **Kafka**.
3.  **Audit/Notification Services** consume the event for logging/alerting.
4.  **User Service** validates recipient status.
5.  Success/Failure is propagated back to finalize or roll back the transaction.

### **2. CQRS (Command Query Responsibility Segregation)**
The Wallet Service separates write operations (Commands like `TransferMoney`) from read operations (Queries like `GetBalance`). This ensures financial ledgers are immutable and optimized for scaling.

### **3. Smart Service Discovery**
Services are never hardcoded. When a service starts:
1.  It registers its IP/Port with **Consul**.
2.  The Gateway asks Consul: *"Where is the Auth Service?"*
3.  Consul returns the healthiest instance.
4.  **Resilience**: The Gateway implements **Smart Retries** to wait for services to become healthy during deployment.

---

## 🚀 Getting Started

### **Prerequisites**
-   Docker & Docker Compose
-   Node.js 20+

### **Infrastructure Setup**
Fire up the core infrastructure (DBs, Kafka, Redis, Consul):
```bash
docker-compose up -d
```

### **Running the Backend**
Install dependencies and start all 6 microservices concurrently:
```bash
npm install
npm run dev
```

### **Running the Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security
-   **Password Hashing**: Argon2 (industry-leading resistance to GPU attacks).
-   **JWT Strategy**: Stateless authentication with automatic Bearer token injection.
-   **Distributed Logging**: Every sensitive action is captured in the Audit microservice for compliance.

---

## 🗺️ Architectural Pattern Roadmap

FintechPlus follows a rigorous microservices blueprint. Below is the status of the patterns implemented and those planned for upcoming phases.

### 📊 Summary Table
| Category | Must-Know Concept | Implementation Status |
| :--- | :--- | :--- |
| **Traffic** | Service Mesh, API Gateway | ✅ API Gateway Live |
| **Data** | Saga, CQRS, Event Sourcing | ✅ CQRS Live / 🚀 Saga Coming |
| **Stability** | Circuit Breaker, Retries | ✅ Retries Live / 🚀 Circuit Breaker Coming |
| **Visibility** | Distributed Tracing, Log Aggregation | 🚀 Coming Soon |

### 🛠️ Detailed Pattern Breakdown

| Category | Pattern | Status | Purpose in FintechPlus |
| :--- | :--- | :--- | :--- |
| **Communication** | **API Gateway** | ✅ Done | Centralized entry point on Port 3000 for routing & auth. |
| | **Service Registry** | ✅ Done | **Consul** (The "Yellow Pages") for dynamic service discovery. |
| | **BFF** | ❌ No | Not needed yet; single unified Gateway for Web. |
| | **Service Mesh** | ❌ No | Overkill for 6 services; handled by Consul + Gateway. |
| **Data** | **CQRS** | ✅ Done | Separated Command/Query logic in Wallet Service for scale. |
| | **DB-per-Service** | ✅ Done | Auth, User, and Wallet use isolated PostgreSQL instances. |
| | **Saga Pattern** | 🚀 Planned | Managing "Undo" logic and distributed consistency for transfers. |
| | **Event Sourcing** | ❌ No | Using State-based storage for core ledgers currently. |
| **Reliability** | **Retry Pattern** | ✅ Done | Smart retries in Discovery & Kafka/gRPC communication. |
| | **Circuit Breaker** | 🚀 Planned | Protecting the Gateway from cascading failures if a service hangs. |
| | **Bulkhead** | ❌ No | Handled naturally by Docker container resource isolation. |
| **Observability** | **Log Aggregation**| 🚀 Planned | Centralized log dashboard (ELK Stack) for all microservices. |
| | **Tracing** | 🚀 Planned | **Zipkin/Jaeger** to track requests across the distributed mesh. |
| **Deployment** | **Strangler Fig** | ✅ Done | Used to migrate legacy logic into the new microservices. |
| | **Sidecar** | ❌ No | Not using a dedicated Service Mesh proxy (Istio) yet. |

---

## 👨‍💻 Developer
Developed with ❤️ as a showcase of **Advanced Agentic Coding** and **Distributed Systems Design**.
