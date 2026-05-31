export type Currency = "NGN" | "USD";
export type TransactionType = "expense" | "income";
export type CategoryKind = "expense" | "income";
export type PeriodType = "week" | "month" | "quarter";
export type ReportPeriodType = "day" | "week" | "month" | "quarter";

export interface Settings {
  id: string;
  user_id: string;
  home_currency: Currency;
  ngn_per_usd: number;
  updated_at: string;
}

export interface Entity {
  id: string;
  user_id: string;
  name: string;
  type: string;
  default_currency: Currency;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: CategoryKind;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  entity_id: string;
  name: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  category: string;
  date: string;
  note: string | null;
  created_at: string;
}

export interface BudgetItem {
  id: string;
  user_id: string;
  entity_id: string;
  period_type: PeriodType;
  period_key: string;
  item_name: string;
  estimated_cost: number;
  currency: Currency;
  justification: string | null;
  created_at: string;
}

export interface ProjectionItem {
  id: string;
  user_id: string;
  entity_id: string;
  period_type: PeriodType;
  period_key: string;
  source_name: string;
  expected_amount: number;
  currency: Currency;
  created_at: string;
}

export interface AccountBalance {
  id: string;
  user_id: string;
  entity_id: string;
  currency: Currency;
  amount: number;
  updated_at: string;
}

export const ENTITY_SEED = [
  { name: "Etin Consult", type: "Nigerian company", default_currency: "NGN" as Currency },
  { name: "Etin Media", type: "US C-corp", default_currency: "USD" as Currency },
  { name: "Personal", type: "Individual", default_currency: "NGN" as Currency },
];

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Clothes",
  "Business Vendor",
  "Gift",
  "Skincare",
  "Snacks",
  "Fruits",
  "Software",
];

export const INCOME_CATEGORIES = ["Client Payment", "Sale", "Other"];
