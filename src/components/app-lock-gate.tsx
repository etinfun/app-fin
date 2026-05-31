"use client";

import { useCallback, useEffect, useState } from "react";
import { ScanFace } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  isAppLockSupported,
  isPlatformAuthenticatorAvailable,
  registerAppLockPasskey,
  unlockWithAppLockPasskey,
} from "@/lib/webauthn";

type AppLockGateProps = {
  userId: string;
  appLockEnabled: boolean;
  credentialId: string | null;
  onCredentialRegistered: (credentialId: string) => void;
  children: React.ReactNode;
};

export function AppLockGate({
  userId,
  appLockEnabled,
  credentialId: initialCredentialId,
  onCredentialRegistered,
  children,
}: AppLockGateProps) {
  const [credentialId, setCredentialId] = useState(initialCredentialId);
  const [unlocked, setUnlocked] = useState(!appLockEnabled);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsLock = appLockEnabled && supported !== false;

  const lock = useCallback(() => {
    if (needsLock && credentialId) setUnlocked(false);
  }, [needsLock, credentialId]);

  useEffect(() => {
    setCredentialId(initialCredentialId);
  }, [initialCredentialId]);

  useEffect(() => {
    if (!appLockEnabled) {
      setUnlocked(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const ok =
        isAppLockSupported() && (await isPlatformAuthenticatorAvailable());
      if (cancelled) return;
      setSupported(ok);
      if (!ok) setUnlocked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [appLockEnabled]);

  useEffect(() => {
    if (!needsLock) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") lock();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [needsLock, lock]);

  const saveCredential = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("settings")
      .update({
        app_lock_credential_id: id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    setCredentialId(id);
    onCredentialRegistered(id);
  };

  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      const id = await registerAppLockPasskey(userId);
      if (!id) {
        setError("Face ID is not available on this device.");
        return;
      }
      await saveCredential(id);
      setUnlocked(true);
    } catch {
      setError("Could not set up Face ID. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    if (!credentialId) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await unlockWithAppLockPasskey(credentialId);
      if (ok) setUnlocked(true);
      else setError("Unlock failed. Try again.");
    } catch {
      setError("Face ID was cancelled or failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!needsLock || unlocked) return <>{children}</>;

  const setup = !credentialId;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ScanFace className="h-10 w-10 text-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {setup ? "Protect Etin Finance" : "Etin Finance is locked"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {setup
                ? "Use Face ID so only you can open this app when you leave or switch away."
                : "Use Face ID to continue."}
            </p>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button
            className="w-full h-12 rounded-xl text-base"
            disabled={busy}
            onClick={setup ? handleEnable : handleUnlock}
          >
            {busy
              ? "Waiting for Face ID…"
              : setup
                ? "Enable Face ID"
                : "Unlock with Face ID"}
          </Button>
        </div>
      </div>
    </>
  );
}
