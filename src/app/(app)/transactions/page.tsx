import { redirect } from "next/navigation";
import { getAppData } from "@/lib/data";
import { TransactionsList } from "@/components/transactions-list";

export default async function TransactionsPage() {
  const data = await getAppData();
  if (!data) redirect("/login");

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Transactions</h1>
      <TransactionsList
        transactions={data.transactions}
        entities={data.entities}
      />
    </div>
  );
}
