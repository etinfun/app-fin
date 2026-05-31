import { redirect } from "next/navigation";
import { getAppData } from "@/lib/data";
import { ReportsScreen } from "@/components/reports-screen";

export default async function ReportsPage() {
  const data = await getAppData();
  if (!data) redirect("/login");

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Reports</h1>
      <ReportsScreen
        transactions={data.transactions}
        budgetItems={data.budgetItems}
        projections={data.projectionItems}
        entities={data.entities}
        settings={data.settings}
      />
    </div>
  );
}
