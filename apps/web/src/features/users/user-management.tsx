"use client";
import { useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "../../lib/api/client";
type User = { id: string; displayName: string; email: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER"; approval: "PENDING" | "APPROVED" | "REJECTED"; disabled: boolean; revision: number };
type Users = { items: User[]; total: number };
const roles: User["role"][] = ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "USER"];

export function UserManagement() {
  const [result, setResult] = useState<Users>(); const [actorRole, setActorRole] = useState<User["role"]>(); const [query, setQuery] = useState(""); const [message, setMessage] = useState("");
  const load = async () => { try { setResult(await apiFetch<Users>(`/users?page=1&pageSize=20&q=${encodeURIComponent(query)}`)); } catch { setMessage("Unable to load accounts."); } };
  useEffect(() => { void load(); void apiFetch<{ role: User["role"] }>("/auth/me").then((user) => setActorRole(user.role)); }, []);
  const change = async (user: User, path: string, payload: object) => { if (!window.confirm("Confirm this access change?")) return; try { await apiFetch(`/users/${user.id}/${path}`, { method: path === "approval" ? "POST" : "PATCH", headers: { "Content-Type": "application/json", "If-Match": `"${user.revision}"` }, body: JSON.stringify(payload) }); setMessage("Account updated."); await load(); } catch (error) { setMessage(error instanceof ApiClientError && error.code === "REVISION_CONFLICT" ? "This account changed. Reload and try again." : "The change could not be completed."); } };
  return <section><h1>User management</h1><form action={() => void load()}><label>Search accounts<input value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="submit">Search</button></form>{message && <p role="status">{message}</p>}<p>{result ? `${result.total} accounts` : "Loading…"}</p><ul>{result?.items.map((user) => <li key={user.id}><strong>{user.displayName}</strong> — {user.email} — {user.role} — {user.approval}{user.disabled ? " — Disabled" : ""}<div>{user.role === "USER" && user.approval !== "APPROVED" && <button onClick={() => void change(user, "approval", { decision: "APPROVED" })}>Approve</button>}<button onClick={() => void change(user, "access", { disabled: !user.disabled })}>{user.disabled ? "Enable" : "Disable"}</button>{actorRole === "SUPER_ADMIN" && <label>Role<select value={user.role} onChange={(event) => void change(user, "role", { role: event.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>}</div></li>)}</ul></section>;
}
