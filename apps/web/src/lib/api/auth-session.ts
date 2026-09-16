import { apiFetch } from "./client";
let refreshInFlight: Promise<void> | undefined;
export async function csrfToken() { return (await apiFetch<{ token: string }>("/auth/csrf")).token; }
export async function refreshSession() { if (!refreshInFlight) refreshInFlight = apiFetch<void>("/auth/refresh", { method: "POST" }).finally(() => { refreshInFlight = undefined; }); return refreshInFlight; }
export async function signOut() { await apiFetch<void>("/auth/logout", { method: "POST" }); if (typeof window !== "undefined") sessionStorage.clear(); }
