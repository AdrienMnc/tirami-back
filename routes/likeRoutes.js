const express = require("express");
const router = express.Router();
const likeRoutes = require("../controllers/likeController");

// Route pour créer une entrée dans la table like (POST)
router.post("/", likeRoutes.createLike);

// Route pour enlever la mention "like" d'un post (DELETE)
router.delete("/:id", likeRoutes.deleteLike);

module.exports = router;
