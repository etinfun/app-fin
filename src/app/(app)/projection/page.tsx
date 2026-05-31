import { redirect } from "next/navigation";
import { getAppData } from "@/lib/data";
import { ProjectionScreen } from "@/components/projection-screen";

export default async function ProjectionPage() {
  const data = await getAppData();
  if (!data) redirect("/login");

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Projection</h1>
      <ProjectionScreen
        projections={data.projectionItems}
        budgetItems={data.budgetItems}
        entities={data.entities}
        settings={data.settings}
        userId={data.user.id}
      />
    </div>
  );
}
