/** Serializes OAS numeric decimals without silently changing a string-mode input's value. */
import Decimal from "decimal.js";
import { ApiHttpError } from "./httpError";

export function toWireDecimal(value: string | number): number {
  const exact = new Decimal(value);
  const number = exact.toNumber();
  if (!Number.isFinite(number) || !new Decimal(String(number)).equals(exact)) {
    throw new ApiHttpError({ statusCode: 400, code: "DECIMAL_PRECISION_UNSUPPORTED", message: "DECIMAL_PRECISION_UNSUPPORTED", requestId: null });
  }
  return number;
}
