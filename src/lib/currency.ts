import type { Currency } from "@/types/database";

export function formatMoney(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currency === "NGN" ? "₦" : "$"}${formatted}`;
}

export function convertToHome(
  amount: number,
  currency: Currency,
  homeCurrency: Currency,
  ngnPerUsd: number
): number {
  if (currency === homeCurrency) return amount;
  if (homeCurrency === "NGN" && currency === "USD") return amount * ngnPerUsd;
  if (homeCurrency === "USD" && currency === "NGN") return amount / ngnPerUsd;
  return amount;
}

export function convertBetween(
  amount: number,
  from: Currency,
  to: Currency,
  ngnPerUsd: number
): number {
  if (from === to) return amount;
  return convertToHome(amount, from, to, ngnPerUsd);
}
