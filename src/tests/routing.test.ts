import { pickBestRoute } from "../services/dexRouter.mock";

test("router returns best quote", async () => {
  const best = await pickBestRoute(10);
  expect(best.dex === "raydium" || best.dex === "meteora").toBe(true);
  expect(best.expectedOutput).toBeGreaterThan(0);
});
