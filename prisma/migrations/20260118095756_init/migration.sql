-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "inputToken" TEXT NOT NULL,
    "outputToken" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "side" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "chosenDex" TEXT,
    "expectedOutput" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
