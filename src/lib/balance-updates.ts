import type { Currency, Transaction, TransactionType } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export function transactionBalanceDelta(
  type: TransactionType,
  amount: number
): number {
  const value = Number(amount);
  return type === "income" ? value : -value;
}

export async function adjustAccountBalance(
  supabase: SupabaseClient,
  params: {
    userId: string;
    entityId: string;
    currency: Currency;
    delta: number;
  }
): Promise<void> {
  const { userId, entityId, currency, delta } = params;
  if (delta === 0) return;

  const { data: existing } = await supabase
    .from("account_balances")
    .select("id, amount")
    .eq("user_id", userId)
    .eq("entity_id", entityId)
    .eq("currency", currency)
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    await supabase
      .from("account_balances")
      .update({
        amount: Number(existing.amount) + delta,
        updated_at: now,
      })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("account_balances").insert({
    user_id: userId,
    entity_id: entityId,
    currency,
    amount: delta,
  });
}

export async function applyTransactionToBalance(
  supabase: SupabaseClient,
  tx: Pick<Transaction, "user_id" | "entity_id" | "currency" | "type" | "amount">
): Promise<void> {
  await adjustAccountBalance(supabase, {
    userId: tx.user_id,
    entityId: tx.entity_id,
    currency: tx.currency,
    delta: transactionBalanceDelta(tx.type, Number(tx.amount)),
  });
}

export async function reverseTransactionOnBalance(
  supabase: SupabaseClient,
  tx: Pick<Transaction, "user_id" | "entity_id" | "currency" | "type" | "amount">
): Promise<void> {
  await adjustAccountBalance(supabase, {
    userId: tx.user_id,
    entityId: tx.entity_id,
    currency: tx.currency,
    delta: -transactionBalanceDelta(tx.type, Number(tx.amount)),
  });
}

export async function syncBalanceForTransactionEdit(
  supabase: SupabaseClient,
  before: Pick<
    Transaction,
    "user_id" | "entity_id" | "currency" | "type" | "amount"
  >,
  after: Pick<
    Transaction,
    "user_id" | "entity_id" | "currency" | "type" | "amount"
  >
): Promise<void> {
  await reverseTransactionOnBalance(supabase, before);
  await applyTransactionToBalance(supabase, after);
}
