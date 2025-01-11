/*
  Warnings:

  - You are about to drop the column `email` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Notification` table. All the data in the column will be lost.
  - Made the column `message` on table `Notification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "phone",
ALTER COLUMN "message" SET NOT NULL;
