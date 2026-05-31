function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const str = atob(base64 + pad);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}

export function isAppLockSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isAppLockSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerAppLockPasskey(
  userId: string
): Promise<string | null> {
  if (!(await isPlatformAuthenticatorAvailable())) return null;

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Etin Finance", id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: userId.slice(0, 8),
        displayName: "Etin Finance",
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) return null;
  return bufferToBase64url(credential.rawId);
}

export async function unlockWithAppLockPasskey(
  credentialId: string
): Promise<boolean> {
  if (!(await isPlatformAuthenticatorAvailable())) return false;

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [
        {
          id: base64urlToBuffer(credentialId),
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60_000,
    },
  });

  return Boolean(assertion);
}
