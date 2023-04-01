const express = require("express");
const router = express.Router();
const followRoutes = require("../controllers/followController");

// Route pour créer une entrée dans la table follow (POST)
router.post("/", followRoutes.createFollow);

// Route pour récupérer tous les utilisateurs suivis par un utilisateur (GET)
router.get("/:id", followRoutes.getAllFollowed);

// Route pour ne plus suivre un utilisateur (DELETE)
router.delete("/:id", followRoutes.deleteFollow);

module.exports = router;
