"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccountBalance, Entity, Settings } from "@/types/database";

const ENTITY_CURRENCIES: Record<string, ("NGN" | "USD")[]> = {
  "Etin Consult": ["NGN"],
  "Etin Media": ["USD"],
  Personal: ["NGN", "USD"],
};

export function BalancesEditor({
  balances: initial,
  entities,
  settings,
  userId,
}: {
  balances: AccountBalance[];
  entities: Entity[];
  settings: Settings;
  userId: string;
}) {
  const router = useRouter();
  const [ngnPerUsd, setNgnPerUsd] = useState(String(settings.ngn_per_usd));
  const [savingRate, setSavingRate] = useState(false);

  const getBalance = (entityId: string, currency: "NGN" | "USD") =>
    initial.find((b) => b.entity_id === entityId && b.currency === currency);

  const handleSaveBalance = async (
    entityId: string,
    currency: "NGN" | "USD",
    amount: number,
    existingId?: string
  ) => {
    const supabase = createClient();
    if (existingId) {
      await supabase
        .from("account_balances")
        .update({ amount, updated_at: new Date().toISOString() })
        .eq("id", existingId);
    } else {
      await supabase.from("account_balances").insert({
        user_id: userId,
        entity_id: entityId,
        currency,
        amount,
      });
    }
    router.refresh();
  };

  const handleSaveRate = async () => {
    setSavingRate(true);
    const supabase = createClient();
    await supabase
      .from("settings")
      .update({
        ngn_per_usd: parseFloat(ngnPerUsd) || 1600,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    setSavingRate(false);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Exchange rate
        </h2>
        <div className="rounded-2xl border border-border/60 p-4 space-y-3">
          <Label htmlFor="rate">NGN per USD</Label>
          <Input
            id="rate"
            type="number"
            inputMode="decimal"
            value={ngnPerUsd}
            onChange={(e) => setNgnPerUsd(e.target.value)}
            className="h-12 text-base"
          />
          <p className="text-xs text-muted-foreground">
            Last updated{" "}
            {format(parseISO(settings.updated_at), "MMM d, yyyy")}
          </p>
          <Button
            className="h-11 w-full"
            onClick={handleSaveRate}
            disabled={savingRate}
          >
            {savingRate ? "Saving…" : "Save rate"}
          </Button>
        </div>
      </section>

      {entities.map((entity) => {
        const currencies = ENTITY_CURRENCIES[entity.name] ?? [
          entity.default_currency,
        ];
        return (
          <section key={entity.id} className="space-y-3">
            <h2 className="text-lg font-semibold">{entity.name}</h2>
            {currencies.map((currency) => {
              const bal = getBalance(entity.id, currency);
              return (
                <BalanceRow
                  key={currency}
                  label={currency}
                  amount={bal ? Number(bal.amount) : 0}
                  updatedAt={bal?.updated_at}
                  onSave={(amount) =>
                    handleSaveBalance(entity.id, currency, amount, bal?.id)
                  }
                />
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

function BalanceRow({
  label,
  amount: initialAmount,
  updatedAt,
  onSave,
}: {
  label: string;
  amount: number;
  updatedAt?: string;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(String(initialAmount));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(parseFloat(amount) || 0);
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-border/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label} balance</Label>
        {updatedAt && (
          <span className="text-xs text-muted-foreground">
            Updated {format(parseISO(updatedAt), "MMM d")}
          </span>
        )}
      </div>
      <Input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-12 text-base"
      />
      <p className="text-sm text-muted-foreground">
        Current: {formatMoney(initialAmount, label as "NGN" | "USD")}
      </p>
      <Button className="h-11 w-full" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save balance"}
      </Button>
    </div>
  );
}
