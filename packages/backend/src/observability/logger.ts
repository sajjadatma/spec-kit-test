const sensitive = /password|token|cookie|authorization|image|provider|emailBody/i;
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitive.test(key) ? "[REDACTED]" : redact(item)]));
  return value;
}
export function logSafe(event: string, context: Record<string, unknown> = {}) { console.info(JSON.stringify({ event, ...(redact(context) as Record<string, unknown>) })); }
