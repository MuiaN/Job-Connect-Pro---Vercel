-- CreateEnum
CREATE TYPE "public"."EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "employmentType" "public"."EmploymentType",
ADD COLUMN     "requirements" TEXT;
