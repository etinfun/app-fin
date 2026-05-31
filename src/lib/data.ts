import { cache } from "react";
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

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function fetchTables(supabase: ServerClient) {
  const [
    settingsRes,
    entitiesRes,
    categoriesRes,
    transactionsRes,
    balancesRes,
    budgetRes,
    projectionRes,
  ] = await Promise.all([
    supabase.from("settings").select("*").maybeSingle(),
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
    settings: settingsRes.data as Settings | null,
    entities: (entitiesRes.data ?? []) as Entity[],
    categories: (categoriesRes.data ?? []) as Category[],
    transactions: (transactionsRes.data ?? []) as Transaction[],
    balances: (balancesRes.data ?? []) as AccountBalance[],
    budgetItems: (budgetRes.data ?? []) as BudgetItem[],
    projectionItems: (projectionRes.data ?? []) as ProjectionItem[],
  };
}

// Wrapped in React.cache so the layout and page that both call getAppData()
// during a single render share one round of queries instead of duplicating
// the auth check and seven table fetches.
export const getAppData = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let tables = await fetchTables(supabase);

  // New users are seeded at the auth callback, so settings normally already
  // exists. This fallback only fires for an account that somehow reaches the
  // app without a settings row — avoiding an extra seed-check query on every
  // normal navigation.
  if (!tables.settings) {
    await ensureUserSeeded(supabase, user.id);
    tables = await fetchTables(supabase);
  }

  return {
    user,
    ...tables,
    settings: tables.settings as Settings,
  };
});

export type AppData = NonNullable<Awaited<ReturnType<typeof getAppData>>>;
