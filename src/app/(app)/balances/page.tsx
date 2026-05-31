import { redirect } from "next/navigation";
import { getAppData } from "@/lib/data";
import { BalancesEditor } from "@/components/balances-editor";

export default async function BalancesPage() {
  const data = await getAppData();
  if (!data) redirect("/login");

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        Account balances
      </h1>
      <BalancesEditor
        balances={data.balances}
        entities={data.entities}
        settings={data.settings}
        userId={data.user.id}
      />
    </div>
  );
}
