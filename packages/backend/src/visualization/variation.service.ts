import type { AttemptService } from "./attempt.service.js";
import type { DraftService, RoomDraft } from "./draft.service.js";

/** A variation deliberately creates a fresh attempt; it never mutates its predecessor. */
export class VariationService {
  constructor(private readonly drafts: DraftService, private readonly attempts: AttemptService) {}
  async retry(ownerId: string, predecessorId: string, consentVersion: string) {
    await this.attempts.get(ownerId, predecessorId);
    const draft = await this.drafts.get(ownerId) as RoomDraft;
    return this.attempts.submit(ownerId, draft, consentVersion);
  }
}
