export type SafeAuditEvent = { actorId?: string; action: string; targetType: string; targetIdentifier: string; before?: Record<string, unknown>; after?: Record<string, unknown>; correlationId?: string };
const forbidden = /password|hash|token|cookie|image|payload|secret/i;
export function assertSafeAuditValue(value: Record<string, unknown> | undefined) { for (const key of Object.keys(value ?? {})) if (forbidden.test(key)) throw new Error("UNSAFE_AUDIT_FIELD"); }
export class AuditService {
  constructor(private readonly writer: { auditEvent: { create(input: unknown): Promise<unknown> } }) {}
  async write(event: SafeAuditEvent) { assertSafeAuditValue(event.before); assertSafeAuditValue(event.after); return this.writer.auditEvent.create({ data: event }); }
}
