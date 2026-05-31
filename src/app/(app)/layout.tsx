export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAppData } from "@/lib/data";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getAppData();
  if (!data) redirect("/login");

  return (
    <AppShell
      userId={data.user.id}
      appLockEnabled={data.settings.app_lock_enabled ?? true}
      appLockCredentialId={data.settings.app_lock_credential_id ?? null}
      entities={data.entities}
    >
      {children}
    </AppShell>
  );
}
