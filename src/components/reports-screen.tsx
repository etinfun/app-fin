"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { convertToHome, formatMoney } from "@/lib/currency";
import {
  getCurrentPeriodKey,
  getPeriodLabel,
  isDateInPeriod,
  shiftPeriodKey,
} from "@/lib/period-keys";
import { sumTransactions } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  BudgetItem,
  Entity,
  ProjectionItem,
  ReportPeriodType,
  Settings,
  Transaction,
} from "@/types/database";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#64748b",
  "#94a3b8",
  "#cbd5e1",
];

export function ReportsScreen({
  transactions,
  budgetItems,
  projections,
  entities,
  settings,
}: {
  transactions: Transaction[];
  budgetItems: BudgetItem[];
  projections: ProjectionItem[];
  entities: Entity[];
  settings: Settings;
}) {
  const [periodType, setPeriodType] = useState<ReportPeriodType>("month");
  const [periodKey, setPeriodKey] = useState(getCurrentPeriodKey("month"));
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const convert = entityFilter === "all";
  const home = settings.home_currency;
  const rate = Number(settings.ngn_per_usd);
  const entityId = entityFilter === "all" ? undefined : entityFilter;

  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (entityId && t.entity_id !== entityId) return false;
      return isDateInPeriod(t.date, periodType, periodKey);
    });
  }, [transactions, entityId, periodType, periodKey]);

  const spendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    periodTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const amt = convert
          ? convertToHome(Number(t.amount), t.currency, home, rate)
          : Number(t.amount);
        map.set(t.category, (map.get(t.category) ?? 0) + amt);
      });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodTransactions, convert, home, rate]);

  const incomeBySource = useMemo(() => {
    const map = new Map<string, number>();
    periodTransactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        const amt = convert
          ? convertToHome(Number(t.amount), t.currency, home, rate)
          : Number(t.amount);
        map.set(t.name, (map.get(t.name) ?? 0) + amt);
      });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodTransactions, convert, home, rate]);

  const budgetPeriodType =
    periodType === "day" ? "month" : (periodType as "week" | "month" | "quarter");
  const budgetPeriodKey =
    periodType === "day" ? getCurrentPeriodKey("month") : periodKey;

  const budgetTotal = budgetItems
    .filter(
      (b) =>
        b.period_type === budgetPeriodType &&
        b.period_key === budgetPeriodKey &&
        (!entityId || b.entity_id === entityId)
    )
    .reduce(
      (sum, b) =>
        sum +
        (convert
          ? convertToHome(Number(b.estimated_cost), b.currency, home, rate)
          : Number(b.estimated_cost)),
      0
    );

  const actualSpend = sumTransactions(transactions, "expense", {
    entityId,
    periodType: periodType === "day" ? "day" : periodType,
    periodKey: periodType === "day" ? periodKey : periodKey,
    homeCurrency: home,
    ngnPerUsd: rate,
    convert,
  });

  const projectedIncome = projections
    .filter(
      (p) =>
        p.period_type === budgetPeriodType &&
        p.period_key === budgetPeriodKey &&
        (!entityId || p.entity_id === entityId)
    )
    .reduce(
      (sum, p) =>
        sum +
        (convert
          ? convertToHome(Number(p.expected_amount), p.currency, home, rate)
          : Number(p.expected_amount)),
      0
    );

  const actualIncome = sumTransactions(transactions, "income", {
    entityId,
    periodType: periodType === "day" ? "day" : periodType,
    periodKey,
    homeCurrency: home,
    ngnPerUsd: rate,
    convert,
  });

  const budgetVsActual = [
    { name: "Budgeted", value: budgetTotal },
    { name: "Actual", value: actualSpend },
  ];

  const projectionVsActual = [
    { name: "Projected", value: projectedIncome },
    { name: "Actual", value: actualIncome },
  ];

  return (
    <div className="space-y-8">
      <div className="flex gap-2 flex-wrap">
        {(["day", "week", "month", "quarter"] as ReportPeriodType[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPeriodType(p);
              setPeriodKey(getCurrentPeriodKey(p));
            }}
            className={cn(
              "min-h-[44px] rounded-xl px-4 text-sm font-medium capitalize",
              periodType === p
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() =>
              setPeriodKey(shiftPeriodKey(periodType, periodKey, -1))
            }
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium">
            {getPeriodLabel(periodType, periodKey)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() =>
              setPeriodKey(shiftPeriodKey(periodType, periodKey, 1))
            }
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

      <Select
        value={entityFilter}
        onValueChange={(v) => v && setEntityFilter(v)}
        items={{
          all: "All (combined)",
          ...Object.fromEntries(entities.map((e) => [e.id, e.name])),
        }}
      >
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All (combined)</SelectItem>
          {entities.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {convert && (
        <p className="text-xs text-muted-foreground">
          Combined view · converted to {home} at ₦{rate.toLocaleString()} / USD
        </p>
      )}

      <ChartSection title="Spend by category">
        {spendByCategory.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={spendByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {spendByCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatMoney(Number(v), home)}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        <LegendList data={spendByCategory} home={home} />
      </ChartSection>

      <ChartSection title="Income by source">
        {incomeBySource.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeBySource} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v) => formatMoney(Number(v), home)} />
              <Bar dataKey="value" fill="#059669" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartSection>

      {periodType !== "day" && (
        <>
          <ChartSection title="Budget vs actual">
            <ComparisonChart data={budgetVsActual} home={home} />
          </ChartSection>

          <ChartSection title="Projection vs actual income">
            <ComparisonChart data={projectionVsActual} home={home} />
          </ChartSection>
        </>
      )}
    </div>
  );
}

function ChartSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
      <div className="rounded-2xl border border-border/60 p-4">{children}</div>
    </section>
  );
}

function EmptyChart() {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      No data for this period.
    </p>
  );
}

function LegendList({
  data,
  home,
}: {
  data: { name: string; value: number }[];
  home: "NGN" | "USD";
}) {
  return (
    <div className="mt-2 space-y-1">
      {data.map((d, i) => (
        <div key={d.name} className="flex justify-between text-xs">
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {d.name}
          </span>
          <span className="font-medium">{formatMoney(d.value, home)}</span>
        </div>
      ))}
    </div>
  );
}

function ComparisonChart({
  data,
  home,
}: {
  data: { name: string; value: number }[];
  home: "NGN" | "USD";
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis hide />
        <Tooltip formatter={(v) => formatMoney(Number(v), home)} />
        <Bar dataKey="value" radius={6}>
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={i === 0 ? "#64748b" : i === 1 ? "#dc2626" : "#059669"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
