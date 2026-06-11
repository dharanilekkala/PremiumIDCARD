-- AlterTable: add unique constraint on Organization.adminEmail
-- Required for upsert-by-adminEmail in seed and signup flow
CREATE UNIQUE INDEX "Organization_adminEmail_key" ON "Organization"("adminEmail");
