CREATE TABLE "VisualizationSession" ("id" uuid PRIMARY KEY,"ownerId" uuid NOT NULL REFERENCES "User"("id"),"createdAt" timestamptz NOT NULL DEFAULT now(),"deletedAt" timestamptz);
