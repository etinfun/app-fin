import { redirect } from "next/navigation";
import { getAppData } from "@/lib/data";
import { Dashboard } from "@/components/dashboard";

export default async function HomePage() {
  const data = await getAppData();
  if (!data) redirect("/login");

  return (
    <Dashboard
      transactions={data.transactions}
      balances={data.balances}
      settings={data.settings}
    />
  );
}
