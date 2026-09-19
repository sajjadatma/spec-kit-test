"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api/client";
const origin = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:3001/api/v1";
type Attempt = { status: string; safeErrorCode?: string };
export function AttemptProgress({ id }: { id: string }) {
  const [attempt, setAttempt] = useState<Attempt>();
  useEffect(() => { const load = () => apiFetch<Attempt>(`/visualizations/${id}`).then(setAttempt); void load(); const timer = setInterval(() => void load(), 2000); return () => clearInterval(timer); }, [id]);
  if (!attempt) return <p role="status">Preparing…</p>;
  return <section><p role="status">Generation status: {attempt.status}{attempt.status === "FAILED" && " You can return to the draft and try again."}</p>{attempt.status === "COMPLETED" && <img src={`${origin}/visualizations/${id}/result`} alt="Generated room visualization" />}{attempt.status === "FAILED" && <a href="/visualization">Return to draft</a>}</section>;
}
