import { AppNavigation } from "../../components/app-navigation";
import { SignOutButton } from "../../features/auth/sign-out-button";
import { redirect } from "next/navigation";
import { serverApiFetch } from "../../lib/api/server";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) { const response = await serverApiFetch("/auth/me").catch(() => null); if (!response?.ok) redirect("/login"); return <main aria-label="Authenticated application"><header><a href="/dashboard">Industrial Dashboard</a><AppNavigation /><SignOutButton /></header>{children}</main>; }
