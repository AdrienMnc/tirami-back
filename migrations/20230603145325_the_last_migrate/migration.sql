/*
  Warnings:

  - You are about to drop the column `name` on the `restaurants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[description_api]` on the table `restaurants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description_api` to the `restaurants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name_api` to the `restaurants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `restaurants` DROP COLUMN `name`,
    ADD COLUMN `description_api` VARCHAR(191) NOT NULL,
    ADD COLUMN `name_api` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `restaurants_description_api_key` ON `restaurants`(`description_api`);
