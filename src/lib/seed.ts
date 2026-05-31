import {
  ENTITY_SEED,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureUserSeeded(supabase: SupabaseClient, userId: string) {
  const { data: existingSettings } = await supabase
    .from("settings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingSettings) return;

  await supabase.from("settings").insert({
    user_id: userId,
    home_currency: "NGN",
    ngn_per_usd: 1600,
  });

  const { data: entities } = await supabase
    .from("entities")
    .insert(
      ENTITY_SEED.map((e) => ({
        user_id: userId,
        name: e.name,
        type: e.type,
        default_currency: e.default_currency,
      }))
    )
    .select();

  const expenseRows = EXPENSE_CATEGORIES.map((name) => ({
    user_id: userId,
    name,
    kind: "expense" as const,
  }));

  const incomeRows = INCOME_CATEGORIES.map((name) => ({
    user_id: userId,
    name,
    kind: "income" as const,
  }));

  await supabase.from("categories").insert([...expenseRows, ...incomeRows]);

  if (entities) {
    const consult = entities.find((e) => e.name === "Etin Consult");
    const media = entities.find((e) => e.name === "Etin Media");
    const personal = entities.find((e) => e.name === "Personal");

    const balanceRows = [];

    if (consult) {
      balanceRows.push({
        user_id: userId,
        entity_id: consult.id,
        currency: "NGN",
        amount: 0,
      });
    }
    if (media) {
      balanceRows.push({
        user_id: userId,
        entity_id: media.id,
        currency: "USD",
        amount: 0,
      });
    }
    if (personal) {
      balanceRows.push(
        {
          user_id: userId,
          entity_id: personal.id,
          currency: "NGN",
          amount: 0,
        },
        {
          user_id: userId,
          entity_id: personal.id,
          currency: "USD",
          amount: 0,
        }
      );
    }

    if (balanceRows.length > 0) {
      await supabase.from("account_balances").insert(balanceRows);
    }
  }
}
