"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { applyTransactionToBalance } from "@/lib/balance-updates";
import { createClient } from "@/lib/supabase/client";
import { useEntityContext } from "@/components/entity-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Category, Currency, Entity, TransactionType } from "@/types/database";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddTransactionPage({
  categories,
  entities,
  userId,
}: {
  categories: Category[];
  entities: Entity[];
  userId: string;
}) {
  const router = useRouter();
  const { lastUsedEntityId, setLastUsedEntityId } = useEntityContext();

  const defaultEntity =
    entities.find((e) => e.id === lastUsedEntityId) ?? entities[0];

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [currency, setCurrency] = useState<Currency>(
    defaultEntity?.default_currency ?? "NGN"
  );
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [entityId, setEntityId] = useState(defaultEntity?.id ?? "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type]
  );

  const handleEntityChange = (id: string) => {
    setEntityId(id);
    const entity = entities.find((e) => e.id === id);
    if (entity) setCurrency(entity.default_currency);
  };

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(/,/g, ""));
    if (!parsed || parsed <= 0 || !name.trim() || !category || !entityId) return;

    setSaving(true);
    const supabase = createClient();
    const row = {
      user_id: userId,
      entity_id: entityId,
      name: name.trim(),
      amount: parsed,
      currency,
      type,
      category,
      date,
      note: note.trim() || null,
    };

    const { error } = await supabase.from("transactions").insert(row);

    if (error) {
      setSaving(false);
      return;
    }

    await applyTransactionToBalance(supabase, row);

    setSaving(false);

    setLastUsedEntityId(entityId);
    router.push("/");
    router.refresh();
  };

  const canSave =
    amount && parseFloat(amount.replace(/,/g, "")) > 0 && name.trim() && category;

  return (
    <div className="px-4 pt-4 pb-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">Add transaction</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-semibold tracking-tight text-muted-foreground">
              {currency === "NGN" ? "₦" : "$"}
            </span>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="h-auto border-0 bg-transparent px-0 text-5xl font-semibold tracking-tight text-foreground shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setCategory("");
              }}
              className={cn(
                "min-h-[48px] rounded-xl text-sm font-medium capitalize transition-colors",
                type === t
                  ? t === "income"
                    ? "bg-emerald-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["NGN", "USD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                "min-h-[48px] rounded-xl text-sm font-medium transition-colors",
                currency === c
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "expense" ? "What did you buy?" : "Income source"}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.name)}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-medium min-h-[44px] transition-colors",
                  category === c.name
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Entity</Label>
          <div className="flex flex-wrap gap-2">
            {entities.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => handleEntityChange(e.id)}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-medium min-h-[44px] transition-colors",
                  entityId === e.id
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-12 text-base"
            placeholder="Add a note"
          />
        </div>

        <Button
          className="h-14 w-full text-base"
          disabled={!canSave || saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
