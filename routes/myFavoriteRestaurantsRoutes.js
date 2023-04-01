const express = require("express");
const router = express.Router();
const myFavoriteRestaurantsRoutes = require("../controllers/myFavoriteRestaurantsController");

// Route pour récupérer tous les restaurants favoris d'un utilisateur (GET)
router.get("/:id", myFavoriteRestaurantsRoutes.getAllMyFavoriteRestaurants);

// Route pour ajouter un restaurant aux favoris d'un utilisateur (POST)
router.post("/", myFavoriteRestaurantsRoutes.addMyFavoriteRestaurant);

// Route pour supprimer un restaurant des favoris d'un utilisateur (DELETE)
router.delete("/:id", myFavoriteRestaurantsRoutes.deleteMyFavoriteRestaurant);

module.exports = router;
