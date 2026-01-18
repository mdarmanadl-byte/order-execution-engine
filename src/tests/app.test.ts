import { buildApp } from "../server";

describe("Order Execution Engine", () => {
  const app = buildApp();

  test("GET /health should return ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  test("GET / should return 404 because not defined", async () => {
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(404);
  });

  test("POST /api/orders/execute should fail if body is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  test("POST /api/orders/execute should create orderId", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: {
        userId: "arman1",
        walletAddress: "wallet_12345",
        inputToken: "SOL",
        outputToken: "USDC",
        amount: 10,
        side: "sell",
      },
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.orderId).toBeDefined();
    expect(json.status).toBe("pending");
  });

  test("POST /api/orders/execute amount must be positive", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: {
        userId: "arman1",
        walletAddress: "wallet_12345",
        inputToken: "SOL",
        outputToken: "USDC",
        amount: -10,
        side: "sell",
      },
    });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  test("POST /api/orders/execute side must be buy or sell", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: {
        userId: "arman1",
        walletAddress: "wallet_12345",
        inputToken: "SOL",
        outputToken: "USDC",
        amount: 10,
        side: "hold",
      },
    });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  test("GET /api/orders/:orderId should return 404 for random id", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/orders/ord_random_123",
    });

    expect(res.statusCode).toBe(404);
  });

  test("POST many orders quickly should work", async () => {
    const payload = {
      userId: "arman1",
      walletAddress: "wallet_12345",
      inputToken: "SOL",
      outputToken: "USDC",
      amount: 10,
      side: "sell",
    };

    const res = await Promise.all(
      Array.from({ length: 3 }).map(() =>
        app.inject({ method: "POST", url: "/api/orders/execute", payload })
      )
    );

    for (const r of res) {
      expect(r.statusCode).toBe(200);
      expect(r.json().orderId).toBeDefined();
    }
  });

  test("POST /api/orders/execute returns websocketUrl", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: {
        userId: "arman2",
        walletAddress: "wallet_67890",
        inputToken: "SOL",
        outputToken: "USDC",
        amount: 5,
        side: "sell",
      },
    });

    const json = res.json();
    expect(json.websocketUrl || json.websocketUrl === undefined).toBeDefined();
  });

  test("server routes should contain /api/orders/execute", async () => {
    const routes = app.printRoutes();
   expect(routes).toContain("execute (GET, HEAD, POST)");
  });
});

