export type OrderSide = "buy" | "sell";

export type OrderStatus =
  | "pending"
  | "routing"
  | "building"
  | "submitted"
  | "confirmed"
  | "failed";


export type DexName = "raydium" | "meteora";

export type ExecuteOrderRequest = {
  userId: string;
  walletAddress: string;
  inputToken: string;
  outputToken: string;
  amount: number;
  side: OrderSide; // buy/sell
};

export type RouteQuote = {
  dex: DexName;
  expectedOutput: number;
  fee: number;
};

export type OrderEntity = {
  orderId: string;
  userId: string;
  walletAddress: string;
  inputToken: string;
  outputToken: string;
  amount: number;
  side: OrderSide;
  status: OrderStatus;
  chosenDex?: DexName;
  expectedOutput?: number;
  createdAt: string;
  updatedAt: string;
};
