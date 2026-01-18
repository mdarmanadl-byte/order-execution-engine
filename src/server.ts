import websocket from "@fastify/websocket";
import dotenv from "dotenv";
import Fastify from "fastify";
dotenv.config();

import { orderRoutes } from "./routes/order.route";

export function buildApp() {
  const app = Fastify({ logger: false });

  app.register(websocket);

  app.get("/health", async () => {
    return { ok: true, name: "Order Execution Engine" };
  });

  app.register(orderRoutes, { prefix: "/api" });

  return app;
}

const PORT = Number(process.env.PORT || 3000);

async function start() {
  // ✅ start worker only when running actual server
  await import("./queue/order.worker");

  const app = buildApp();
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Server running at http://localhost:${PORT}`);
}

if (require.main === module) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
