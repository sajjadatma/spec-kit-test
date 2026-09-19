import Decimal from "decimal.js";
export type CurrencyCode = "IRR" | "TOMAN" | "USD";
export function convertPrice(base: string, currency: CurrencyCode, rialsPerUsd?: string) {
  const amount = new Decimal(base); const rials = currency === "IRR" ? amount : currency === "TOMAN" ? amount.mul(10) : rialsPerUsd ? amount.mul(rialsPerUsd) : undefined;
  const format = (value: Decimal, decimals: number) => value.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toFixed(decimals);
  return { base: { amount: base, currency }, irr: rials ? format(rials, 0) : undefined, toman: rials ? format(rials.div(10), 0) : undefined, usd: rials && rialsPerUsd ? format(rials.div(rialsPerUsd), 2) : currency === "USD" ? format(amount, 2) : undefined, rateAvailable: Boolean(rialsPerUsd) };
}
