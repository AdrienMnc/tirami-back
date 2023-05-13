const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");

// Route pour afficher un Restaurant (GET)
router.get("/:id_api", restaurantController.getOneRestaurantFromApiID);

// Route pour créer un nouveau restaurant (POST)
router.post("/create", restaurantController.createRestaurant);

module.exports = router;
