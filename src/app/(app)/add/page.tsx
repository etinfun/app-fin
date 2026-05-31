import { redirect } from "next/navigation";
import { getAppData } from "@/lib/data";
import AddTransactionForm from "@/components/add-transaction-form";

export default async function AddPage() {
  const data = await getAppData();
  if (!data) redirect("/login");

  return (
    <AddTransactionForm
      categories={data.categories}
      entities={data.entities}
      userId={data.user.id}
    />
  );
}
