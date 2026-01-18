import { OrderStatus } from "../types/order";

type WsConnection = {
  send: (data: string) => void;
};

type WsMessage = {
  orderId: string;
  status: OrderStatus;
  message?: string;
  meta?: Record<string, any>;
  at: string;
};

const subscribers = new Map<string, Set<WsConnection>>();

export function subscribe(orderId: string, conn: WsConnection) {
  if (!subscribers.has(orderId)) subscribers.set(orderId, new Set());
  subscribers.get(orderId)!.add(conn);
}

export function unsubscribe(orderId: string, conn: WsConnection) {
  subscribers.get(orderId)?.delete(conn);
  if (subscribers.get(orderId)?.size === 0) subscribers.delete(orderId);
}

export function emitStatus(
  orderId: string,
  status: OrderStatus,
  message?: string,
  meta?: Record<string, any>
) {
  const payload: WsMessage = {
    orderId,
    status,
    message,
    meta,
    at: new Date().toISOString(),
  };

  const conns = subscribers.get(orderId);
  if (!conns) return;

  for (const c of conns) {
    try {
      c.send(JSON.stringify(payload));
    } catch {}
  }
}
