import { apiFetch } from "./client";
let refreshInFlight: Promise<void> | undefined;
const refreshLockKey = "industrial-dashboard.refresh-lock";
const tabId = typeof crypto !== "undefined" ? crypto.randomUUID() : "server";
type RefreshLock = { owner: string; expiresAt: number };

function readRefreshLock(): RefreshLock | undefined {
  if (typeof window === "undefined") return undefined;
  try { const value = localStorage.getItem(refreshLockKey); return value ? JSON.parse(value) as RefreshLock : undefined; } catch { return undefined; }
}

function releaseRefreshLock() { if (typeof window !== "undefined" && readRefreshLock()?.owner === tabId) localStorage.removeItem(refreshLockKey); }

async function waitForOtherTab(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => { window.removeEventListener("storage", onStorage); resolve(false); }, 5_000);
    const onStorage = (event: StorageEvent) => {
      if (event.key === refreshLockKey && !event.newValue) { window.clearTimeout(timer); window.removeEventListener("storage", onStorage); resolve(true); }
    };
    window.addEventListener("storage", onStorage);
  });
}

async function acquireRefreshLock(): Promise<boolean> {
  if (typeof window === "undefined") return true;
  const existing = readRefreshLock();
  if (existing && existing.owner !== tabId && existing.expiresAt > Date.now()) return false;
  localStorage.setItem(refreshLockKey, JSON.stringify({ owner: tabId, expiresAt: Date.now() + 5_000 }));
  return readRefreshLock()?.owner === tabId;
}

export async function csrfToken() { return (await apiFetch<{ token: string }>("/auth/csrf")).token; }
export async function refreshSession() { if (!refreshInFlight) refreshInFlight = (async () => { if (!(await acquireRefreshLock())) { if (await waitForOtherTab()) return; throw new Error("REFRESH_AMBIGUOUS"); } try { await apiFetch<void>("/auth/refresh", { method: "POST" }); } catch (error) { clearPrivateState(); throw error; } finally { releaseRefreshLock(); } })().finally(() => { refreshInFlight = undefined; }); return refreshInFlight; }
export function clearPrivateState() { if (typeof window !== "undefined") { sessionStorage.clear(); localStorage.removeItem("private-draft-owner"); releaseRefreshLock(); } }
export async function signOut() { try { await apiFetch<void>("/auth/logout", { method: "POST" }); } finally { clearPrivateState(); } }
