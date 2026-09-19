CREATE TYPE "JobStatus" AS ENUM ('QUEUED','RUNNING','SUCCEEDED','FAILED');
ALTER TABLE "GenerationAttempt" ADD COLUMN "dispatchFence" integer NOT NULL DEFAULT 0;
CREATE TABLE "BackgroundJob" (
  "id" uuid PRIMARY KEY,
  "kind" varchar(32) NOT NULL,
  "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
  "attemptId" uuid UNIQUE REFERENCES "GenerationAttempt"("id") ON DELETE CASCADE,
  "fencingToken" integer NOT NULL DEFAULT 0,
  "leaseUntil" timestamptz,
  "workerId" varchar(100),
  "attempts" integer NOT NULL DEFAULT 0,
  "safeErrorCode" varchar(80),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "BackgroundJob_kind_status_leaseUntil_idx" ON "BackgroundJob"("kind", "status", "leaseUntil");
