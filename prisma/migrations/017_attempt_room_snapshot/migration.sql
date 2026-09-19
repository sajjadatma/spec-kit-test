ALTER TABLE "GenerationAttempt" ADD COLUMN "roomAssetId" uuid;
UPDATE "GenerationAttempt" SET "roomAssetId" = (SELECT "roomAssetId" FROM "RoomDraft" WHERE "RoomDraft"."ownerId" = "GenerationAttempt"."ownerId") WHERE "roomAssetId" IS NULL;
ALTER TABLE "GenerationAttempt" ALTER COLUMN "roomAssetId" SET NOT NULL;
ALTER TABLE "GenerationAttempt" ADD CONSTRAINT "GenerationAttempt_roomAssetId_fkey" FOREIGN KEY ("roomAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT;
