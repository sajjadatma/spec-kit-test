ALTER TABLE "GenerationAttempt"
  ADD COLUMN "consentVersion" varchar(64) NOT NULL DEFAULT 'room-surfaces-v1',
  ADD COLUMN "consentAcceptedAt" timestamptz NOT NULL DEFAULT now();
