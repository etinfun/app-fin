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
        {periodTotals.map((p) => (
          <div key={p.key} className="space-y-2">
            <p className="text-sm font-medium">{p.label}</p>
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Spent"
                value={formatForView(p.expense, displayCurrency)}
                tone="negative"
              />
              <StatCard
                label="Income"
                value={formatForView(p.income, displayCurrency)}
                tone="positive"
              />
              <StatCard
                label="Net"
                value={formatForView(p.net, displayCurrency)}
                tone={p.net >= 0 ? "positive" : "negative"}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Runway
        </h2>
        <StatCard
          label={runway.label}
          value={
            runway.months === null
              ? "—"
              : `${runway.months.toFixed(1)} mo`
          }
          subValue={
            runway.monthlyBurn > 0
              ? `Burn ~${formatMoney(runway.monthlyBurn, homeCurrency)}/mo`
              : "Not enough data yet"
          }
        />
      </section>
    </div>
  );
}
