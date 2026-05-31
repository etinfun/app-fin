"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    authError === "auth"
      ? "Sign-in link expired or opened in the wrong browser. Enter the 6-digit code from your email below."
      : null
  );

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setSent(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.replace(/\s/g, "");
    if (token.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Etin Finance</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in with a magic link or 6-digit code sent to your email.
        </p>

        {sent ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl bg-muted/60 p-5">
              <p className="font-medium">Check your email</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a sign-in email to {email}. On iPhone, the link often
                fails if it opens inside Mail — use the code below instead.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">6-digit code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="h-14 text-center text-2xl font-semibold tracking-[0.3em]"
                  placeholder="000000"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                type="submit"
                className="h-12 w-full text-base"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying…" : "Sign in with code"}
              </Button>
            </form>

            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setSent(false);
                setOtp("");
                setError(null);
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendLink} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={loading}
            >
              {loading ? "Sending…" : "Send sign-in email"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
