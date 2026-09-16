export type JobKind = "mail" | "image" | "cleanup";
export type LeasedJob = { id: string; kind: JobKind; fencingToken: number };
export interface JobPort { claim(kind: JobKind, workerId: string): Promise<LeasedJob | null>; heartbeat(job: LeasedJob): Promise<boolean>; complete(job: LeasedJob, outcome: "SUCCEEDED" | "FAILED", safeErrorCode?: string): Promise<void>; }
export class JobRunner { constructor(private readonly port: JobPort, private readonly workerId: string) {} async runOnce(kind: JobKind, handler: (job: LeasedJob) => Promise<void>) { const job = await this.port.claim(kind, this.workerId); if (!job) return false; try { await handler(job); await this.port.complete(job, "SUCCEEDED"); } catch { await this.port.complete(job, "FAILED", "JOB_FAILED"); } return true; } }
