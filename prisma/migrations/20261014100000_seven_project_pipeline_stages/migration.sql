UPDATE "Project"
SET "status" = 'origination'
WHERE "status" = 'planning';

UPDATE "Project"
SET "status" = 'development'
WHERE "status" = 'scoping';

UPDATE "Project"
SET "status" = 'operating'
WHERE "status" = 'operational';

ALTER TABLE "Project"
ALTER COLUMN "status" SET DEFAULT 'origination';
