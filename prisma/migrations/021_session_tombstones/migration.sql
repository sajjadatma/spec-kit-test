ALTER TABLE "VisualizationSession" ADD COLUMN "deletedById" uuid REFERENCES "User"("id") ON DELETE RESTRICT;
CREATE INDEX "VisualizationSession_deletedAt_idx" ON "VisualizationSession"("deletedAt");
