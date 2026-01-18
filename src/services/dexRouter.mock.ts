import { RouteQuote } from "../types/order";

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function getRaydiumQuote(amount: number): Promise<RouteQuote> {
  await new Promise((r) => setTimeout(r, 200));
  const fee = amount * 0.003;
  return {
    dex: "raydium",
    expectedOutput: amount * random(0.98, 1.02) - fee,
    fee,
  };
}

export async function getMeteoraQuote(amount: number): Promise<RouteQuote> {
  await new Promise((r) => setTimeout(r, 200));
  const fee = amount * 0.0025;
  return {
    dex: "meteora",
    expectedOutput: amount * random(0.98, 1.02) - fee,
    fee,
  };
}

export async function pickBestRoute(amount: number) {
  const [r, m] = await Promise.all([
    getRaydiumQuote(amount),
    getMeteoraQuote(amount),
  ]);

  return r.expectedOutput >= m.expectedOutput ? r : m;
}
