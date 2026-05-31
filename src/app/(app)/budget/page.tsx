import { redirect } from "next/navigation";
import { getAppData } from "@/lib/data";
import { BudgetScreen } from "@/components/budget-screen";

export default async function BudgetPage() {
  const data = await getAppData();
  if (!data) redirect("/login");

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Budget</h1>
      <BudgetScreen
        items={data.budgetItems}
        transactions={data.transactions}
        entities={data.entities}
        categories={data.categories.filter((c) => c.kind === "expense")}
        settings={data.settings}
        userId={data.user.id}
      />
    </div>
  );
}
