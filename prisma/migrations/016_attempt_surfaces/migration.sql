CREATE TABLE "AttemptSurface" (
  "id" uuid PRIMARY KEY,
  "attemptId" uuid NOT NULL REFERENCES "GenerationAttempt"("id") ON DELETE CASCADE,
  "surface" varchar(8) NOT NULL,
  "productId" uuid NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT,
  "assetId" uuid NOT NULL REFERENCES "FileAsset"("id") ON DELETE RESTRICT,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("attemptId", "surface")
);
