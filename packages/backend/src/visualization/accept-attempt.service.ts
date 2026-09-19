import type { Attempt, AttemptService } from "./attempt.service.js";
import type { RoomDraft } from "./draft.service.js";

export type AcceptAttemptInput = { ownerId: string; draft: RoomDraft; consentVersion: string };
/** Explicit application boundary for all generation acceptance checks and atomic persistence. */
export class AcceptAttemptService {
  constructor(private readonly attempts: AttemptService) {}
  accept(input: AcceptAttemptInput): Promise<Attempt> {
    return this.attempts.submit(input.ownerId, input.draft, input.consentVersion);
  }
}
