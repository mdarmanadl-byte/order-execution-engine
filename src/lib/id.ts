import crypto from "crypto";

export function makeOrderId() {
  return "ord_" + crypto.randomBytes(8).toString("hex");
}
