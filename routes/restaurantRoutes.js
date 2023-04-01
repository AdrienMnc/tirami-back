const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");

// Route pour afficher un Restaurant (GET)
router.get("/:id", restaurantController.getOneRestaurant);
