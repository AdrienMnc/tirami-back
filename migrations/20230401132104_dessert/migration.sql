/*
  Warnings:

  - You are about to drop the `My_restaurant` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dessert_id` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurant_id` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `My_restaurant` DROP FOREIGN KEY `My_restaurant_restaurant_id_fkey`;

-- DropForeignKey
ALTER TABLE `My_restaurant` DROP FOREIGN KEY `My_restaurant_user_id_fkey`;

-- AlterTable
ALTER TABLE `Post` ADD COLUMN `dessert_id` INTEGER NOT NULL,
    ADD COLUMN `restaurant_id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `My_restaurant`;

-- CreateTable
CREATE TABLE `Dessert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Dessert_name_key`(`name`),
    UNIQUE INDEX `Dessert_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `My_restaurants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `restaurant_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_dessert_id_fkey` FOREIGN KEY (`dessert_id`) REFERENCES `Dessert`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `My_restaurants` ADD CONSTRAINT `My_restaurants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `My_restaurants` ADD CONSTRAINT `My_restaurants_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `Restaurant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
