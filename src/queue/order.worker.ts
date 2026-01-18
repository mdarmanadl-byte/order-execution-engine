import { Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { redisConnection } from "../lib/redis";
import { initActiveOrdersRedis, removeActiveOrder, setActiveOrder } from "../services/activeOrders";
import { getMeteoraQuote, getRaydiumQuote } from "../services/dexRouter.mock";
import { emitStatus } from "../ws/orderEvents";
import { ORDER_QUEUE_NAME } from "./order.queue";

function makeMockTxHash() {
  return "tx_mock_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export const orderWorker = new Worker(
  ORDER_QUEUE_NAME,
  async (job) => {
    await initActiveOrdersRedis();

    const { orderId } = job.data as { orderId: string };

    try {
      await setActiveOrder(orderId, "pending");

      emitStatus(orderId, "routing", "Comparing DEX prices...");
      await setActiveOrder(orderId, "routing");

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Order not found in DB");

      // log both quotes transparently
      const [raydium, meteora] = await Promise.all([
        getRaydiumQuote(order.amount),
        getMeteoraQuote(order.amount),
      ]);

      console.log(`[ROUTER] order=${orderId} Raydium=${raydium.expectedOutput.toFixed(4)} fee=${raydium.fee.toFixed(4)}`);
      console.log(`[ROUTER] order=${orderId} Meteora=${meteora.expectedOutput.toFixed(4)} fee=${meteora.fee.toFixed(4)}`);

      const best = raydium.expectedOutput >= meteora.expectedOutput ? raydium : meteora;
      console.log(`[ROUTER] order=${orderId} ✅ chosen=${best.dex}`);

      emitStatus(orderId, "building", "Creating transaction (mock)", {
        chosenDex: best.dex,
        expectedOutput: best.expectedOutput,
      });
      await setActiveOrder(orderId, "building");

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "building",
          chosenDex: best.dex,
          expectedOutput: best.expectedOutput,
          errorMessage: null,
        },
      });

      // simulate delay 2-3 sec as doc says
      await new Promise((r) => setTimeout(r, 2000 + Math.floor(Math.random() * 1000)));

      emitStatus(orderId, "submitted", "Transaction sent to network (mock)");
      await setActiveOrder(orderId, "submitted");

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "submitted" },
      });

      // confirm delay
      await new Promise((r) => setTimeout(r, 1000));

      const txHash = makeMockTxHash();

      emitStatus(orderId, "confirmed", "Transaction successful ✅", {
        txHash,
        finalExecutionPrice: best.expectedOutput,
      });
      await setActiveOrder(orderId, "confirmed");

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "confirmed" },
      });

      await removeActiveOrder(orderId);

      return { ok: true, txHash };
    } catch (err: any) {
      const errorMessage = err?.message || "Unknown error";

      emitStatus(orderId, "failed", "Order failed ❌", { error: errorMessage });
      await setActiveOrder(orderId, "failed");

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "failed", errorMessage },
      });

      // keep failed order visible for post-mortem
      return { ok: false, error: errorMessage };
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
  }
);

// BullMQ events for retries exhausted
orderWorker.on("failed", async (job, err) => {
  if (!job) return;

  // when attempts exhausted (<=3), mark failed
  if (job.attemptsMade >= (job.opts.attempts || 1)) {
    const orderId = (job.data as any).orderId;
    const errorMessage = err?.message || "Worker failed";

    emitStatus(orderId, "failed", "Retry attempts exhausted ❌", { error: errorMessage });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "failed", errorMessage },
    });

    await removeActiveOrder(orderId);
  }
});
