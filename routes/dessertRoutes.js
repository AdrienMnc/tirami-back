const express = require("express");
const router = express.Router();
const dessertController = require("../controllers/dessertController");

// Route pour récupérer tous les desserts (GET)
router.get("/", dessertController.getAllDesserts);

// Route pour récupérer tous les types de desserts (GET)
router.get("/types", dessertController.getAllDessertTypes);

// Route pour récupérer tous les desserts d'un type donné (GET)
router.get("/:type", dessertController.getAllDessertsFromType);

module.exports = router;
