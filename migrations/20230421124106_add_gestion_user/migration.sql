-- AlterTable
ALTER TABLE `posts` ADD COLUMN `author_deactivated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deactivated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deactivated_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `deactivated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deactivated_at` DATETIME(3) NULL,
    ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT false;
