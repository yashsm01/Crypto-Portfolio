# Crypto Portfolio Tracker

A full-stack application for tracking cryptocurrency portfolios with real-time price updates, built with React, NestJS, PostgreSQL, Redis, and Kafka.

## Docker Compose Setup Guide

### Step 1: Install Docker and Docker Compose
1. Install Docker Desktop:
   - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
   - Mac: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
   - Linux: [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)

2. Verify installation:
```bash
docker --version
docker-compose --version
```

### Step 2: Configure Docker Compose
Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      backend:
        condition: service_healthy
        restart: true

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=1234
      - DB_NAME=crypto_portfolio
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your_jwt_secret_key_here
      - KAFKA_BROKERS=kafka:29092
    depends_on:
      postgres:
        condition: service_healthy
        restart: true
      redis:
        condition: service_healthy
        restart: true
      kafka:
        condition: service_started
        restart: true
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=1234
      - POSTGRES_DB=crypto_portfolio
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --bind 0.0.0.0
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.0
    hostname: zookeeper
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper_data:/var/lib/zookeeper/data
      - zookeeper_log:/var/lib/zookeeper/log
    healthcheck:
      test: echo stat | nc localhost 2181 || exit 1
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  kafka:
    image: confluentinc/cp-kafka:7.3.0
    hostname: kafka
    ports:
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_LISTENERS: INTERNAL://kafka:29092,EXTERNAL://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://kafka:29092,EXTERNAL://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
    volumes:
      - kafka_data:/var/lib/kafka/data
    depends_on:
      zookeeper:
        condition: service_healthy
        restart: true

volumes:
  postgres_data:
  redis_data:
  kafka_data:
  zookeeper_data:
  zookeeper_log:
```

### Step 3: Configure Frontend Dockerfile
Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
```

### Step 4: Configure Backend Dockerfile
Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

RUN apk add --no-cache curl

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1

ENV NODE_ENV=development
ENV NPM_CONFIG_LOGLEVEL=verbose

CMD ["npm", "run", "start:dev"]
```

### Step 5: Start the Application

1. Build and start all services:
```bash
docker-compose up --build -d
```

2. View logs (optional):
```bash
docker-compose logs -f
```

3. Stop the application:
```bash
docker-compose down
```

4. Stop and remove volumes (clean start):
```bash
docker-compose down -v
```

### Step 6: Verify Services
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Kafka: localhost:9092
- Zookeeper: localhost:2181

### Common Docker Commands
```bash
# List running containers
docker ps

# View container logs
docker logs <container_name>

# Enter container shell
docker exec -it <container_name> sh

# Restart a service
docker-compose restart <service_name>

# View service health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Features

- 🔐 User Authentication (JWT)
- 💰 Real-time Cryptocurrency Price Updates
- 📊 Portfolio Management (Add/Remove Cryptocurrencies)
- 💾 Data Persistence with PostgreSQL
- 🚀 Price Caching with Redis
- 📡 Event-Driven Updates with Kafka
- 🐳 Docker Containerization

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

## Quick Start (Docker)

1. Clone the repository:
```bash
git clone https://github.com/yashsm01/Crypto-Portfolio.git
cd crypto-portfolio
```

2. Create environment files:

`.env` in project root:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=1234
POSTGRES_DB=crypto_portfolio
JWT_SECRET=your_jwt_secret_key_here
```

3. Start the application:
```bash
docker-compose up --build
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger Documentation: http://localhost:3000/api

## Architecture

### Frontend (React + TypeScript)
- Vite for build tooling
- Material-UI for components
- Redux Toolkit for state management
- Axios for API calls

### Backend (NestJS)
- REST API with Swagger documentation
- JWT authentication
- PostgreSQL with Sequelize ORM
- Redis for price caching
- Kafka for event streaming
- CoinGecko API integration

### Infrastructure
- PostgreSQL for data persistence
- Redis for caching
- Kafka for event streaming
- Docker & Docker Compose for containerization

## Manual Installation (Development)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Create `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1234
DB_NAME=crypto_portfolio
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_here
KAFKA_BROKERS=localhost:9092
```

4. Start the backend:
```bash
npm run start:dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

4. Start the frontend:
```bash
npm run dev
```

## API Documentation

Once the application is running, visit http://localhost:3000/api for the Swagger documentation.

### Main Endpoints:

- Authentication:
  - POST `/auth/register` - Register new user
  - POST `/auth/login` - Login user

- Portfolio:
  - GET `/portfolio` - Get user's portfolio
  - POST `/portfolio` - Add new cryptocurrency
  - DELETE `/portfolio/:id` - Remove cryptocurrency

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### Portfolios Table
```sql
CREATE TABLE portfolios (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id),
  symbol VARCHAR(255) NOT NULL,
  quantity DECIMAL(18,8) NOT NULL,
  currentPrice DECIMAL(24,14),
  totalValue DECIMAL(24,14),
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## Docker Services

- `frontend`: React application (port 5173)
- `backend`: NestJS API (port 3000)
- `postgres`: PostgreSQL database (port 5432)
- `redis`: Redis cache (port 6379)
- `zookeeper`: ZooKeeper for Kafka (port 2181)
- `kafka`: Kafka message broker (ports 9092, 29092)

## Troubleshooting

1. **Database Connection Issues**
   - Ensure PostgreSQL container is healthy
   - Check database credentials in environment variables
   - Verify database port is not in use

2. **Redis Connection Issues**
   - Verify Redis container is running
   - Check Redis URL in environment variables
   - Ensure Redis port is not in use

3. **Kafka Connection Issues**
   - Ensure ZooKeeper is healthy before Kafka starts
   - Check Kafka broker configuration
   - Verify Kafka ports are not in use

## Development Notes

- The application uses Material-UI for styling
- Redux Toolkit for state management
- Real-time price updates every 2 minutes
- Price changes ≥ 5% trigger Kafka events
- Redis caches prices for 60 seconds

## License

This project is licensed under the MIT License - see the LICENSE file for details.
