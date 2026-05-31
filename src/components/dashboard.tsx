"use client";

import { useMemo } from "react";
import { useEntityContext } from "@/components/entity-context";
import { EntitySwitcher } from "@/components/entity-switcher";
import { StatCard } from "@/components/stat-card";
import {
  calculateRunway,
  combinedBalanceHome,
  getPeriodTotals,
  sumBalancesNative,
} from "@/lib/calculations";
import { entityUsesMultipleCurrencies } from "@/lib/entity-currency";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type {
  AccountBalance,
  Currency,
  Settings,
  Transaction,
} from "@/types/database";

export function Dashboard({
  transactions,
  balances,
  settings,
}: {
  transactions: Transaction[];
  balances: AccountBalance[];
  settings: Settings;
}) {
  const { selectedEntityId, entities } = useEntityContext();
  const combined = selectedEntityId === "all";
  const entityId = combined ? undefined : selectedEntityId;
  const selectedEntity = entities.find((e) => e.id === selectedEntityId);
  const homeCurrency = settings.home_currency;
  const ngnPerUsd = Number(settings.ngn_per_usd);

  const convertTotals =
    combined || entityUsesMultipleCurrencies(selectedEntity);

  const nativeBalances = useMemo(
    () => sumBalancesNative(balances, entityId),
    [balances, entityId]
  );

  const combinedBalance = useMemo(
    () => combinedBalanceHome(balances, homeCurrency, ngnPerUsd, entityId),
    [balances, homeCurrency, ngnPerUsd, entityId]
  );

  const periodTotals = useMemo(
    () =>
      getPeriodTotals(
        transactions,
        homeCurrency,
        ngnPerUsd,
        entityId,
        convertTotals
      ),
    [transactions, homeCurrency, ngnPerUsd, entityId, convertTotals]
  );

  const runway = useMemo(
    () =>
      calculateRunway(transactions, balances, {
        entityId,
        homeCurrency,
        ngnPerUsd,
        combined,
      }),
    [transactions, balances, entityId, homeCurrency, ngnPerUsd, combined]
  );

  const displayCurrency: Currency | undefined = convertTotals
    ? homeCurrency
    : selectedEntity?.default_currency;

  const formatForView = (amount: number, currency?: Currency) => {
    const c = currency ?? homeCurrency;
    return formatMoney(amount, c);
  };

  return (
    <div className="px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Spending, balances, and runway
        </p>
      </div>

      <EntitySwitcher />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Balance
        </h2>
        {!combined && (
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(nativeBalances) as [Currency, number][])
              .filter(([cur]) =>
                entityUsesMultipleCurrencies(selectedEntity)
                  ? true
                  : cur === selectedEntity?.default_currency
              )
              .map(([cur, amt]) => (
                <StatCard
                  key={cur}
                  label={cur}
                  value={formatMoney(amt, cur)}
                />
              ))}
          </div>
        )}
        {(combined ||
          entityUsesMultipleCurrencies(selectedEntity) ||
          nativeBalances.NGN > 0 ||
          nativeBalances.USD > 0) && (
          <StatCard
            label={
              combined
                ? `Combined (${homeCurrency})`
                : `Combined (${homeCurrency} at your rate)`
            }
            value={formatMoney(combinedBalance, homeCurrency)}
            subValue={
              combined
                ? `Converted at ₦${ngnPerUsd.toLocaleString()} / USD`
                : undefined
            }
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Period totals
          {convertTotals && (
            <span className="normal-case font-normal ml-1">
              · converted to {homeCurrency}
            </span>
          )}
        </h2>
        <div className="overflow-hidden rounded-2xl bg-muted/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="px-4 pt-3 pb-2 text-left font-medium"> </th>
                <th className="px-3 pt-3 pb-2 text-right font-medium">Spent</th>
                <th className="px-3 pt-3 pb-2 text-right font-medium">Income</th>
                <th className="px-4 pt-3 pb-2 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {periodTotals.map((p) => (
                <tr key={p.key} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium">{p.label}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-red-600 dark:text-red-400">
                    {formatForView(p.expense, displayCurrency)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatForView(p.income, displayCurrency)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-medium tabular-nums",
                      p.net >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatForView(p.net, displayCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Runway
        </h2>
        {runway.months === null ? (
          <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Add income and expenses to see how long your balance lasts.
          </div>
        ) : (
          <StatCard
            label={runway.label}
            value={`${runway.months.toFixed(1)} mo`}
            subValue={
              runway.monthlyBurn > 0
                ? `Burn ~${formatMoney(runway.monthlyBurn, homeCurrency)}/mo`
                : undefined
            }
          />
        )}
      </section>
    </div>
  );
}
