import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis";

export const ORDER_QUEUE_NAME = "order-execution-queue";

export const orderQueue = new Queue(ORDER_QUEUE_NAME, {
  connection: redisConnection,
});
