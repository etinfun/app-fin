"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { Entity, Transaction } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TransactionsList({
  transactions: initial,
  entities,
}: {
  transactions: Transaction[];
  entities: Entity[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const categories = useMemo(
    () => [...new Set(initial.map((t) => t.category))].sort(),
    [initial]
  );

  const filtered = useMemo(() => {
    return initial.filter((t) => {
      if (entityFilter !== "all" && t.entity_id !== entityFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [initial, entityFilter, typeFilter, categoryFilter, dateFrom, dateTo]);

  const entityName = (id: string) =>
    entities.find((e) => e.id === id)?.name ?? "Unknown";

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", id);
    router.refresh();
  };

  const handleUpdate = async (tx: Transaction) => {
    const supabase = createClient();
    await supabase
      .from("transactions")
      .update({
        name: tx.name,
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        category: tx.category,
        entity_id: tx.entity_id,
        date: tx.date,
        note: tx.note,
      })
      .eq("id", tx.id);
    setEditing(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Select value={entityFilter} onValueChange={(v) => v && setEntityFilter(v)}>
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
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
          <SelectTrigger className="h-11 col-span-2">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-11"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-11"
          placeholder="To"
        />
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border/60 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground text-sm">
            No transactions yet.
          </p>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id}>
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expandedId === tx.id ? null : tx.id)
                }
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left min-h-[64px] active:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{tx.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tx.category} · {entityName(tx.entity_id)} ·{" "}
                    {format(parseISO(tx.date), "MMM d")}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 font-semibold tabular-nums",
                    tx.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {tx.type === "income" ? "+" : "−"}
                  {formatMoney(Number(tx.amount), tx.currency)}
                </p>
              </button>

              {expandedId === tx.id && (
                <div className="border-t border-border/60 bg-muted/30 px-4 py-4 space-y-3">
                  {tx.note && (
                    <p className="text-sm text-muted-foreground">{tx.note}</p>
                  )}
                  {editing?.id === tx.id ? (
                    <EditForm
                      tx={editing}
                      entities={entities}
                      onChange={setEditing}
                      onSave={() => handleUpdate(editing)}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1 h-11"
                        onClick={() => setEditing({ ...tx })}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 h-11"
                        onClick={() => handleDelete(tx.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EditForm({
  tx,
  entities,
  onChange,
  onSave,
  onCancel,
}: {
  tx: Transaction;
  entities: Entity[];
  onChange: (tx: Transaction) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <Input
        value={tx.name}
        onChange={(e) => onChange({ ...tx, name: e.target.value })}
        className="h-11"
      />
      <Input
        type="number"
        value={tx.amount}
        onChange={(e) =>
          onChange({ ...tx, amount: parseFloat(e.target.value) || 0 })
        }
        className="h-11"
      />
      <Input
        type="date"
        value={tx.date}
        onChange={(e) => onChange({ ...tx, date: e.target.value })}
        className="h-11"
      />
      <Select
        value={tx.entity_id}
        onValueChange={(v) => v && onChange({ ...tx, entity_id: v })}
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
      <div className="flex gap-2 pt-1">
        <Button className="flex-1 h-11" onClick={onSave}>
          Save
        </Button>
        <Button variant="secondary" className="flex-1 h-11" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
