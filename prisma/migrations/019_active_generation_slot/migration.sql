CREATE UNIQUE INDEX "GenerationAttempt_one_active_owner"
ON "GenerationAttempt" ("ownerId")
WHERE "status" IN ('PREPARING', 'GENERATING');
