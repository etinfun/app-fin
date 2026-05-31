import { differenceInDays, parseISO, subDays } from "date-fns";
import { convertToHome } from "@/lib/currency";
import { getDayKey, getPeriodKey, isDateInPeriod } from "@/lib/period-keys";
import type {
  AccountBalance,
  Currency,
  ReportPeriodType,
  Transaction,
  TransactionType,
} from "@/types/database";

export interface RunwayResult {
  months: number | null;
  monthlyBurn: number;
  isEarlyEstimate: boolean;
  label: string;
}

export function sumTransactions(
  transactions: Transaction[],
  type: TransactionType,
  options?: {
    entityId?: string;
    periodType?: ReportPeriodType;
    periodKey?: string;
    homeCurrency?: Currency;
    ngnPerUsd?: number;
    convert?: boolean;
  }
): number {
  const {
    entityId,
    periodType,
    periodKey,
    homeCurrency = "NGN",
    ngnPerUsd = 1600,
    convert = false,
  } = options ?? {};

  return transactions
    .filter((t) => t.type === type)
    .filter((t) => !entityId || t.entity_id === entityId)
    .filter((t) => {
      if (!periodType || !periodKey) return true;
      if (periodType === "day") return getDayKey(t.date) === periodKey;
      return isDateInPeriod(t.date, periodType, periodKey);
    })
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      if (convert) {
        return sum + convertToHome(amount, t.currency, homeCurrency, ngnPerUsd);
      }
      return sum + amount;
    }, 0);
}

export function sumBalancesNative(
  balances: AccountBalance[],
  entityId?: string
): Record<Currency, number> {
  const result: Record<Currency, number> = { NGN: 0, USD: 0 };

  balances
    .filter((b) => !entityId || b.entity_id === entityId)
    .forEach((b) => {
      result[b.currency] += Number(b.amount);
    });

  return result;
}

export function combinedBalanceHome(
  balances: AccountBalance[],
  homeCurrency: Currency,
  ngnPerUsd: number,
  entityId?: string
): number {
  const native = sumBalancesNative(balances, entityId);
  return (
    convertToHome(native.NGN, "NGN", homeCurrency, ngnPerUsd) +
    convertToHome(native.USD, "USD", homeCurrency, ngnPerUsd)
  );
}

export function calculateRunway(
  transactions: Transaction[],
  balances: AccountBalance[],
  options: {
    entityId?: string;
    homeCurrency: Currency;
    ngnPerUsd: number;
    combined?: boolean;
  }
): RunwayResult {
  const { entityId, homeCurrency, ngnPerUsd, combined = false } = options;
  const today = new Date();
  const ninetyDaysAgo = subDays(today, 90);

  const expenses = transactions.filter((t) => {
    if (t.type !== "expense") return false;
    if (entityId && t.entity_id !== entityId) return false;
    const date = parseISO(t.date);
    return date >= ninetyDaysAgo && date <= today;
  });

  if (expenses.length === 0) {
    return {
      months: null,
      monthlyBurn: 0,
      isEarlyEstimate: true,
      label: "Not enough data yet",
    };
  }

  const expenseDates = expenses.map((t) => parseISO(t.date));
  const earliest = expenseDates.reduce((a, b) => (a < b ? a : b));
  const daysSpan = Math.max(1, differenceInDays(today, earliest) + 1);

  const totalBurn = expenses.reduce((sum, t) => {
    const amount = Number(t.amount);
    if (combined) {
      return sum + convertToHome(amount, t.currency, homeCurrency, ngnPerUsd);
    }
    return sum + amount;
  }, 0);

  let monthlyBurn: number;
  let isEarlyEstimate = false;

  if (daysSpan < 30) {
    monthlyBurn = (totalBurn / daysSpan) * 30;
    isEarlyEstimate = true;
  } else {
    monthlyBurn = totalBurn / 3;
  }

  if (monthlyBurn === 0) {
    return {
      months: null,
      monthlyBurn: 0,
      isEarlyEstimate,
      label: "Not enough data yet",
    };
  }

  const balanceHome = combinedBalanceHome(
    balances,
    homeCurrency,
    ngnPerUsd,
    entityId
  );

  const months = balanceHome / monthlyBurn;

  return {
    months,
    monthlyBurn,
    isEarlyEstimate,
    label: isEarlyEstimate ? "Early estimate" : "Runway",
  };
}

export function getPeriodTotals(
  transactions: Transaction[],
  homeCurrency: Currency,
  ngnPerUsd: number,
  entityId?: string,
  convert = false
) {
  const now = new Date();
  const todayKey = getDayKey(now);
  const weekKey = getPeriodKey(now, "week");
  const monthKey = getPeriodKey(now, "month");
  const quarterKey = getPeriodKey(now, "quarter");

  const periods = [
    { label: "Today", type: "day" as const, key: todayKey },
    { label: "This week", type: "week" as const, key: weekKey },
    { label: "This month", type: "month" as const, key: monthKey },
    { label: "This quarter", type: "quarter" as const, key: quarterKey },
  ];

  return periods.map((p) => {
    const expense = sumTransactions(transactions, "expense", {
      entityId,
      periodType: p.type,
      periodKey: p.key,
      homeCurrency,
      ngnPerUsd,
      convert,
    });
    const income = sumTransactions(transactions, "income", {
      entityId,
      periodType: p.type,
      periodKey: p.key,
      homeCurrency,
      ngnPerUsd,
      convert,
    });
    return {
      ...p,
      expense,
      income,
      net: income - expense,
    };
  });
}
