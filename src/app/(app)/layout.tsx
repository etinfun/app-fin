export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAppData } from "@/lib/data";
import { EntityProvider } from "@/components/entity-context";
import { AppNav } from "@/components/app-nav";
import { AddFab } from "@/components/add-fab";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getAppData();
  if (!data) redirect("/login");

  return (
    <EntityProvider entities={data.entities}>
      <div className="mx-auto min-h-screen max-w-lg bg-background pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        {children}
        <AddFab />
        <AppNav />
      </div>
    </EntityProvider>
  );
}
