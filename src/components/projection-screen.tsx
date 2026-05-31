"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { convertToHome, formatMoney } from "@/lib/currency";
import { shouldConvertForView } from "@/lib/entity-currency";
import {
  getCurrentPeriodKey,
  getPeriodLabel,
  shiftPeriodKey,
} from "@/lib/period-keys";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BudgetItem,
  Currency,
  Entity,
  PeriodType,
  ProjectionItem,
  Settings,
} from "@/types/database";

export function ProjectionScreen({
  projections: initial,
  budgetItems,
  entities,
  settings,
  userId,
}: {
  projections: ProjectionItem[];
  budgetItems: BudgetItem[];
  entities: Entity[];
  settings: Settings;
  userId: string;
}) {
  const router = useRouter();
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [periodKey, setPeriodKey] = useState(getCurrentPeriodKey("month"));
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProjectionItem | null>(null);

  const filtered = useMemo(
    () =>
      initial.filter(
        (i) =>
          i.period_type === periodType &&
          i.period_key === periodKey &&
          (entityFilter === "all" || i.entity_id === entityFilter)
      ),
    [initial, periodType, periodKey, entityFilter]
  );

  const filteredBudget = useMemo(
    () =>
      budgetItems.filter(
        (i) =>
          i.period_type === periodType &&
          i.period_key === periodKey &&
          (entityFilter === "all" || i.entity_id === entityFilter)
      ),
    [budgetItems, periodType, periodKey, entityFilter]
  );

  const convert = shouldConvertForView(entityFilter, entities, [
    ...filtered,
    ...filteredBudget,
  ]);
  const home = settings.home_currency;
  const rate = Number(settings.ngn_per_usd);

  const projectedIncome = filtered.reduce(
    (sum, i) =>
      sum +
      (convert
        ? convertToHome(Number(i.expected_amount), i.currency, home, rate)
        : Number(i.expected_amount)),
    0
  );

  const budgetedSpend = filteredBudget.reduce(
    (sum, i) =>
      sum +
      (convert
        ? convertToHome(Number(i.estimated_cost), i.currency, home, rate)
        : Number(i.estimated_cost)),
    0
  );

  const projectedNet = projectedIncome - budgetedSpend;

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("projection_items").delete().eq("id", id);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["week", "month", "quarter"] as PeriodType[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPeriodType(p);
              setPeriodKey(getCurrentPeriodKey(p));
            }}
            className={cn(
              "flex-1 min-h-[44px] rounded-xl text-sm font-medium capitalize",
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
          onClick={() => setPeriodKey(shiftPeriodKey(periodType, periodKey, -1))}
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
          onClick={() => setPeriodKey(shiftPeriodKey(periodType, periodKey, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Select
        value={entityFilter}
        onValueChange={(v) => v && setEntityFilter(v)}
        items={{
          all: "All entities",
          ...Object.fromEntries(entities.map((e) => [e.id, e.name])),
        }}
      >
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All entities</SelectItem>
          {entities.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-3 gap-2">
        <SummaryCard
          label="Projected income"
          value={formatMoney(projectedIncome, home)}
          tone="positive"
        />
        <SummaryCard
          label="Budgeted spend"
          value={formatMoney(budgetedSpend, home)}
        />
        <SummaryCard
          label="Projected net"
          value={formatMoney(projectedNet, home)}
          tone={projectedNet >= 0 ? "positive" : "negative"}
        />
      </div>

      <Button
        className="h-12 w-full"
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
      >
        Add projection
      </Button>

      {(showForm || editing) && (
        <ProjectionForm
          entities={entities}
          userId={userId}
          periodType={periodType}
          periodKey={periodKey}
          item={editing}
          onDone={() => {
            setShowForm(false);
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <div className="divide-y divide-border rounded-2xl border border-border/60 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No projections for this period.
          </p>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="px-4 py-4 space-y-2">
              <div className="flex justify-between gap-3">
                <p className="font-medium">{item.source_name}</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  {formatMoney(Number(item.expected_amount), item.currency)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 h-10"
                  onClick={() => {
                    setEditing(item);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 h-10"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold mt-1",
          tone === "positive" && "text-emerald-600 dark:text-emerald-400",
          tone === "negative" && "text-red-600 dark:text-red-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ProjectionForm({
  entities,
  userId,
  periodType,
  periodKey,
  item,
  onDone,
  onCancel,
}: {
  entities: Entity[];
  userId: string;
  periodType: PeriodType;
  periodKey: string;
  item: ProjectionItem | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [sourceName, setSourceName] = useState(item?.source_name ?? "");
  const [amount, setAmount] = useState(String(item?.expected_amount ?? ""));
  const [currency, setCurrency] = useState<Currency>(item?.currency ?? "NGN");
  const [entityId, setEntityId] = useState(item?.entity_id ?? entities[0]?.id);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = parseFloat(amount);
    if (!sourceName.trim() || !parsed || !entityId) return;
    setSaving(true);
    const supabase = createClient();
    const row = {
      user_id: userId,
      entity_id: entityId,
      period_type: periodType,
      period_key: periodKey,
      source_name: sourceName.trim(),
      expected_amount: parsed,
      currency,
    };

    if (item) {
      await supabase.from("projection_items").update(row).eq("id", item.id);
    } else {
      await supabase.from("projection_items").insert(row);
    }
    setSaving(false);
    onDone();
  };

  return (
    <div className="rounded-2xl border border-border/60 p-4 space-y-3">
      <Label>Source name</Label>
      <Input
        value={sourceName}
        onChange={(e) => setSourceName(e.target.value)}
        className="h-11"
      />
      <Input
        type="number"
        placeholder="Expected amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-11"
      />
      <div className="grid grid-cols-2 gap-2">
        {(["NGN", "USD"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={cn(
              "min-h-[44px] rounded-xl text-sm font-medium",
              currency === c
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <Select
        value={entityId}
        onValueChange={(v) => v && setEntityId(v)}
        items={Object.fromEntries(entities.map((e) => [e.id, e.name]))}
      >
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {entities.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button className="flex-1 h-11" onClick={save} disabled={saving}>
          Save
        </Button>
        <Button variant="secondary" className="flex-1 h-11" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
