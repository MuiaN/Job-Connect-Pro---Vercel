/*
  Warnings:

  - Made the column `meetingUrl` on table `Interview` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "public"."Interview" ALTER COLUMN "meetingUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."JobSeeker" ADD COLUMN     "profileVisibility" "public"."ProfileVisibility" NOT NULL DEFAULT 'PUBLIC';
