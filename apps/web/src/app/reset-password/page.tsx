import { AuthForm } from "../../features/auth/auth-forms";
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <main><h1>Choose a new password</h1><AuthForm mode="reset" initialToken={token ?? ""} /></main>; }
