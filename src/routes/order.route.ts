import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { prisma } from "../db/prisma";
import { makeOrderId } from "../lib/id";
import { orderQueue } from "../queue/order.queue";
import { emitStatus, subscribe, unsubscribe } from "../ws/orderEvents";

const executeSchema = z.object({
  userId: z.string().min(1),
  walletAddress: z.string().min(5),
  inputToken: z.string().min(1),
  outputToken: z.string().min(1),
  amount: z.number().positive(),
  side: z.enum(["buy", "sell"]),
});

export async function orderRoutes(app: FastifyInstance) {
  /**
   * ✅ SAME ENDPOINT (HTTP + WebSocket):
   * HTTP: POST /api/orders/execute
   * WS:   WS   /api/orders/execute?orderId=xxxx
   */

  // ✅ WebSocket handler (same endpoint)
  app.get(
    "/orders/execute",
    { websocket: true },
    (connection, req: FastifyRequest) => {
      const q = (req.query as any) || {};
      const orderId = q.orderId as string | undefined;

      if (!orderId) {
        connection.send(
          JSON.stringify({
            status: "failed",
            message: "Missing orderId in query (?orderId=...)",
            at: new Date().toISOString(),
          })
        );
        connection.close();
        return;
      }

      // ✅ subscribe orderId -> connection
      subscribe(orderId, connection);

      // initial message
      connection.send(
        JSON.stringify({
          orderId,
          status: "pending",
          message: "WebSocket connected. Streaming order updates...",
          at: new Date().toISOString(),
        })
      );

      // cleanup when ws closes
     (connection as any).on?.("close", () => {
        unsubscribe(orderId, connection);
      });

    }
  );

  // ✅ HTTP create order + queue execution
  app.post("/orders/execute", async (req, reply) => {
    const body = executeSchema.parse(req.body);
    const orderId = makeOrderId();

    await prisma.order.create({
      data: {
        id: orderId,
        userId: body.userId,
        walletAddress: body.walletAddress,
        inputToken: body.inputToken,
        outputToken: body.outputToken,
        amount: body.amount,
        side: body.side,
        status: "pending",
      },
    });

    emitStatus(orderId, "pending", "Order received and queued");

    await orderQueue.add(
      "execute-order",
      { orderId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    return reply.send({
      orderId,
      status: "pending",
      websocketUrl: `ws://localhost:3000/api/orders/execute?orderId=${orderId}`,
    });
  });

  // ✅ GET order from DB
  app.get("/orders/:orderId", async (req, reply) => {
    const { orderId } = req.params as any;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return reply.code(404).send({ error: "Order not found" });

    return reply.send(order);
  });
}
