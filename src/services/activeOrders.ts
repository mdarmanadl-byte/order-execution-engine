import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
export const activeRedis = createClient({ url: redisUrl });

activeRedis.on("error", (err) => console.error("Redis error:", err));

export async function initActiveOrdersRedis() {
  if (!activeRedis.isOpen) await activeRedis.connect();
}

export async function setActiveOrder(orderId: string, status: string) {
  await activeRedis.hSet("active_orders", orderId, status);
}

export async function removeActiveOrder(orderId: string) {
  await activeRedis.hDel("active_orders", orderId);
}

export async function getActiveOrders() {
  return await activeRedis.hGetAll("active_orders");
}
