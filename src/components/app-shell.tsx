"use client";

import { useState } from "react";
import { AppLockGate } from "@/components/app-lock-gate";
import { EntityProvider } from "@/components/entity-context";
import { AppNav } from "@/components/app-nav";
import { AddFab } from "@/components/add-fab";
import type { Entity } from "@/types/database";

type AppShellProps = {
  userId: string;
  appLockEnabled: boolean;
  appLockCredentialId: string | null;
  entities: Entity[];
  children: React.ReactNode;
};

export function AppShell({
  userId,
  appLockEnabled,
  appLockCredentialId,
  entities,
  children,
}: AppShellProps) {
  const [credentialId, setCredentialId] = useState(appLockCredentialId);

  return (
    <EntityProvider entities={entities}>
      <AppLockGate
        userId={userId}
        appLockEnabled={appLockEnabled}
        credentialId={credentialId}
        onCredentialRegistered={setCredentialId}
      >
        <div className="mx-auto min-h-screen max-w-lg bg-background pb-[calc(9rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
          {children}
          <AddFab />
          <AppNav />
        </div>
      </AppLockGate>
    </EntityProvider>
  );
}
