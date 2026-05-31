"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { convertToHome, formatMoney } from "@/lib/currency";
import {
  getCurrentPeriodKey,
  getPeriodLabel,
  shiftPeriodKey,
} from "@/lib/period-keys";
import { sumTransactions } from "@/lib/calculations";
import { shouldConvertForView } from "@/lib/entity-currency";
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
  Settings,
  Transaction,
} from "@/types/database";

export function BudgetScreen({
  items: initial,
  transactions,
  entities,
  settings,
  userId,
}: {
  items: BudgetItem[];
  transactions: Transaction[];
  entities: Entity[];
  settings: Settings;
  userId: string;
}) {
  const router = useRouter();
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [periodKey, setPeriodKey] = useState(getCurrentPeriodKey("month"));
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);

  const filteredItems = useMemo(() => {
    return initial.filter(
      (i) =>
        i.period_type === periodType &&
        i.period_key === periodKey &&
        (entityFilter === "all" || i.entity_id === entityFilter)
    );
  }, [initial, periodType, periodKey, entityFilter]);

  const convert = shouldConvertForView(entityFilter, entities, filteredItems);

  const totalBudgeted = useMemo(() => {
    return filteredItems.reduce((sum, item) => {
      const amount = Number(item.estimated_cost);
      if (convert) {
        return (
          sum +
          convertToHome(
            amount,
            item.currency,
            settings.home_currency,
            Number(settings.ngn_per_usd)
          )
        );
      }
      return sum + amount;
    }, 0);
  }, [filteredItems, convert, settings]);

  const totalActual = useMemo(() => {
    return sumTransactions(transactions, "expense", {
      entityId: entityFilter === "all" ? undefined : entityFilter,
      periodType,
      periodKey,
      homeCurrency: settings.home_currency,
      ngnPerUsd: Number(settings.ngn_per_usd),
      convert,
    });
  }, [transactions, entityFilter, periodType, periodKey, settings, convert]);

  const variance = totalBudgeted - totalActual;
  const displayCurrency = convert ? settings.home_currency : undefined;

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("budget_items").delete().eq("id", id);
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
      >
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Entity" />
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
        <TotalCard
          label="Budgeted"
          value={
            displayCurrency
              ? formatMoney(totalBudgeted, displayCurrency)
              : formatMoney(totalBudgeted, settings.home_currency)
          }
        />
        <TotalCard
          label="Actual"
          value={
            displayCurrency
              ? formatMoney(totalActual, displayCurrency)
              : formatMoney(totalActual, settings.home_currency)
          }
        />
        <TotalCard
          label="Variance"
          value={
            displayCurrency
              ? formatMoney(variance, displayCurrency)
              : formatMoney(variance, settings.home_currency)
          }
          tone={variance >= 0 ? "positive" : "negative"}
        />
      </div>

      <Button
        className="h-12 w-full"
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
      >
        Add budget item
      </Button>

      {(showForm || editing) && (
        <BudgetItemForm
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
        {filteredItems.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No budget items for this period.
          </p>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="px-4 py-4 space-y-2">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-medium">{item.item_name}</p>
                  {item.justification && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.justification}
                    </p>
                  )}
                </div>
                <p className="font-semibold shrink-0">
                  {formatMoney(Number(item.estimated_cost), item.currency)}
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

function TotalCard({
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

function BudgetItemForm({
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
  item: BudgetItem | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [itemName, setItemName] = useState(item?.item_name ?? "");
  const [cost, setCost] = useState(String(item?.estimated_cost ?? ""));
  const [currency, setCurrency] = useState<Currency>(
    item?.currency ?? "NGN"
  );
  const [entityId, setEntityId] = useState(item?.entity_id ?? entities[0]?.id);
  const [justification, setJustification] = useState(item?.justification ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = parseFloat(cost);
    if (!itemName.trim() || !parsed || !entityId) return;
    setSaving(true);
    const supabase = createClient();
    const row = {
      user_id: userId,
      entity_id: entityId,
      period_type: periodType,
      period_key: periodKey,
      item_name: itemName.trim(),
      estimated_cost: parsed,
      currency,
      justification: justification.trim() || null,
    };

    if (item) {
      await supabase.from("budget_items").update(row).eq("id", item.id);
    } else {
      await supabase.from("budget_items").insert(row);
    }
    setSaving(false);
    onDone();
  };

  return (
    <div className="rounded-2xl border border-border/60 p-4 space-y-3">
      <Label>Item name</Label>
      <Input value={itemName} onChange={(e) => setItemName(e.target.value)} className="h-11" />
      <Input
        type="number"
        placeholder="Estimated cost"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
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
      <Select value={entityId} onValueChange={(v) => v && setEntityId(v)}>
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
      <Input
        placeholder="Justification (optional)"
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        className="h-11"
      />
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
