"use client";

import { useState } from "react";
import { signOut } from "../../lib/api/auth-session";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  async function leave() { setBusy(true); try { await signOut(); window.location.assign("/login"); } finally { setBusy(false); } }
  return <button type="button" onClick={leave} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>;
}
