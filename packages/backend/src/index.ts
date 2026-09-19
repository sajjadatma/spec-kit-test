export const APPLICATION_NAME = "industrial-dashboard";
export { MailService, ResetMailCipher } from "./infrastructure/mail/mail.service.js";
export type { ResetMail } from "./infrastructure/mail/mail.service.js";
export { LocalMailAdapter, SmtpMailAdapter } from "./infrastructure/mail/smtp.adapter.js";
export { AuthenticationService } from "./identity/authentication.service.js";
export type { AccountAccess, AccountForAuthentication, AuthenticationStore } from "./identity/authentication.service.js";
export { RegistrationService } from "./identity/registration.service.js";
export type { RegisteredUser, RegistrationStore } from "./identity/registration.service.js";
export { PrismaIdentityStore } from "./identity/prisma-identity.store.js";
export { SessionService } from "./identity/session.service.js";
export { PasswordResetService } from "./identity/password-reset.service.js";
export { createPrismaClient } from "./infrastructure/prisma/prisma.service.js";
export { normalizeEmail } from "./identity/password.service.js";
export { RateLimitService } from "./identity/rate-limit.service.js";
export type { RateLimitScope, RateLimitStore } from "./identity/rate-limit.service.js";
export { UserManagementService } from "./identity/user-management.service.js";
export type { Actor, FixedRole, UserSummary } from "./identity/user-management.service.js";
export { ProductService } from "./catalog/product.service.js";
export { convertPrice } from "./pricing/conversion.js";
export { PricingService } from "./pricing/pricing.service.js";
export { GalleryService } from "./catalog/gallery.service.js";
export { UploadService } from "./media/upload.service.js";
export { ProductQueryService } from "./catalog/product-query.service.js";
export { DraftService } from "./visualization/draft.service.js";
export { FakeImageGenerationAdapter } from "./infrastructure/images/fake.adapter.js";
export type { ImageGenerationService, GenerationInput, GenerationOutput } from "./infrastructure/images/image-generation.js";
export { AttemptService } from "./visualization/attempt.service.js";
export { PrismaJobPort } from "./infrastructure/jobs/prisma-job.port.js";
export { JobRunner } from "./infrastructure/jobs/job-runner.js";
export type { JobPort, JobKind, LeasedJob } from "./infrastructure/jobs/job-runner.js";
export { LocalStorageAdapter } from "./infrastructure/storage/local.adapter.js";
export { StorageService } from "./infrastructure/storage/storage.service.js";
export { ResetEmailOutboxService } from "./infrastructure/mail/outbox.service.js";
export type { ClaimedResetEmail, ResetEmailOutboxStore } from "./infrastructure/mail/outbox.service.js";

export { OpenAiImageGenerationAdapter } from "./infrastructure/images/openai.adapter.js";
export { roomSurfacesPrompt, ROOM_SURFACES_PROMPT_VERSION } from "./infrastructure/images/prompts/room-surfaces-v1.js";

export { PersistentDeadlineService } from "./visualization/deadline.service.js";
export { GenerationRecoveryService } from "./visualization/recovery.service.js";

export { VariationService } from "./visualization/variation.service.js";

export { AcceptAttemptService } from "./visualization/accept-attempt.service.js";

export { HistoryService } from "./visualization/history.service.js";
export type { HistoryActor } from "./visualization/history.service.js";

export { DeleteSessionService } from "./visualization/delete-session.service.js";
