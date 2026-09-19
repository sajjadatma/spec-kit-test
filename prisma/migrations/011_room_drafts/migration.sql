CREATE TABLE "RoomDraft" (
  "id" uuid PRIMARY KEY,
  "ownerId" uuid NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "floorSelected" boolean NOT NULL DEFAULT false,
  "wallSelected" boolean NOT NULL DEFAULT false,
  "floorProductId" uuid,
  "wallProductId" uuid,
  "revision" integer NOT NULL DEFAULT 0,
  "expiresAt" timestamptz NOT NULL
);
CREATE INDEX "RoomDraft_expiresAt_idx" ON "RoomDraft"("expiresAt");
