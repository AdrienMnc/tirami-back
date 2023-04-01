const express = require("express");
const router = express.Router();
const dessertController = require("../controllers/dessertController");

// Route pour récupérer tous les desserts (GET)
router.get("/", dessertController.getAllDesserts);

module.exports = router;
