````md
# Backend Task 2 — Order Execution Engine ✅

This project is an **Order Execution Engine** that processes **ONE order type (Market Order)** with:
- DEX routing (Raydium vs Meteora — mock implementation)
- Queue processing (BullMQ + Redis)
- Order history persistence (PostgreSQL + Prisma)
- Real-time WebSocket status updates (Fastify)

---

## ✅ Why I chose Market Order
I chose **Market Orders** because they execute immediately at the current price, which best demonstrates the complete end-to-end flow: **routing → queuing → execution → real-time WebSocket updates**.

### Extending this engine
- **Limit Orders:** Add a price watcher that triggers execution only when the target price is reached before enqueueing execution.
- **Sniper Orders:** Trigger execution on token launch/migration events, then run routing + execution as usual.

---

## ✅ Order Execution Flow (WebSocket Status)
Order lifecycle events are streamed as:

`pending → routing → building → submitted → confirmed/failed`

### Status meaning
- **pending**: Order received and queued  
- **routing**: Comparing DEX prices  
- **building**: Creating transaction  
- **submitted**: Transaction sent to network  
- **confirmed**: Transaction successful (includes txHash)  
- **failed**: If any step fails (includes error)

---

## ✅ DEX Router (Mock)
The router simulates:
- Quotes from **Raydium** and **Meteora**
- Mock price variations (~2–5% difference)
- Realistic delays (2–3 seconds)
- Routes order execution to the best venue

Routing decisions are logged for transparency.

---

## ✅ Tech Stack
- **Node.js + TypeScript**
- **Fastify** (HTTP + WebSocket)
- **BullMQ + Redis** (queue, concurrency 10)
- **PostgreSQL + Prisma** (order history)
- **Docker Compose** (Postgres + Redis)

---

## ✅ Setup Instructions

### 1) Install dependencies
```bash
npm install
````

### 2) Start PostgreSQL + Redis

```bash
docker compose up -d
docker ps
```

### 3) Prisma setup

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4) Run the backend

```bash
npm run dev
```

Server runs at:

* [http://localhost:3000](http://localhost:3000)

---

## ✅ API Endpoints

### ✅ Health Check

**GET**

```
/health
```

### ✅ Execute Order (Market)

**POST**

```
/api/orders/execute
```

Example body:

```json
{
  "userId": "arman1",
  "walletAddress": "wallet_12345",
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": 10,
  "side": "sell"
}
```

### ✅ WebSocket Status Stream (same endpoint)

Connect WebSocket:

```
ws://localhost:3000/api/orders/execute?orderId=<ORDER_ID>
```

### ✅ Get Order Status

**GET**

```
/api/orders/:orderId
```

---

## ✅ Testing (11 Tests)

Run tests:

```bash
npm test
```

---

## ✅ Thunder Client (VS Code) Usage

* POST order: `http://localhost:3000/api/orders/execute`
* WS stream: `ws://localhost:3000/api/orders/execute?orderId=...`
* GET order: `http://localhost:3000/api/orders/<orderId>`

---

## ✅ Deployment URL

(Add your deployed public URL here)

---

## ✅ YouTube Demo Link (1–2 min)

(Add your public YouTube demo link here)

```
```
