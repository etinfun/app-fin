import { createClient } from "@/lib/supabase/server";
import { ensureUserSeeded } from "@/lib/seed";
import type {
  AccountBalance,
  BudgetItem,
  Category,
  Entity,
  ProjectionItem,
  Settings,
  Transaction,
} from "@/types/database";

export async function getAppData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await ensureUserSeeded(supabase, user.id);

  const [
    settingsRes,
    entitiesRes,
    categoriesRes,
    transactionsRes,
    balancesRes,
    budgetRes,
    projectionRes,
  ] = await Promise.all([
    supabase.from("settings").select("*").single(),
    supabase.from("entities").select("*").order("created_at"),
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("account_balances").select("*"),
    supabase.from("budget_items").select("*").order("created_at"),
    supabase.from("projection_items").select("*").order("created_at"),
  ]);

  return {
    user,
    settings: settingsRes.data as Settings,
    entities: (entitiesRes.data ?? []) as Entity[],
    categories: (categoriesRes.data ?? []) as Category[],
    transactions: (transactionsRes.data ?? []) as Transaction[],
    balances: (balancesRes.data ?? []) as AccountBalance[],
    budgetItems: (budgetRes.data ?? []) as BudgetItem[],
    projectionItems: (projectionRes.data ?? []) as ProjectionItem[],
  };
}

export type AppData = NonNullable<Awaited<ReturnType<typeof getAppData>>>;
