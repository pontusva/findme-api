/*
  Warnings:

  - A unique constraint covering the columns `[lostReportId]` on the table `Location` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "lostReportId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Location_lostReportId_key" ON "Location"("lostReportId");
