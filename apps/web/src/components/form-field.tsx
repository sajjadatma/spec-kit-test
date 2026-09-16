import { useId } from "react";
export function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { const id = useId(); return <div><label htmlFor={id}>{label}</label>{children}{error && <p id={`${id}-error`} role="alert">{error}</p>}</div>; }
