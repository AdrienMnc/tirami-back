/*
  Warnings:

  - Added the required column `rating` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `follows` ADD COLUMN `deactivated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deactivated_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `likes` ADD COLUMN `deactivated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deactivated_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `pictures` ADD COLUMN `deactivated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deactivated_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `posts` ADD COLUMN `rating` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `restaurants` ADD COLUMN `average_rating` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `post_count` INTEGER NOT NULL DEFAULT 0;
