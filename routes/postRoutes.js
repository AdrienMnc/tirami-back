const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");

// Route pour créer un post (POST)
router.post("/create", postController.createPost);

// Route pour récupérer tous les posts pour un restaurant (GET)
router.get("/:id", postController.getAllPostsForOneRestaurant);

// Route pour mettre à jour un post (PUT)
router.put("/:id", postController.updatePost);

// Route pour supprimer un post (DELETE)
router.delete("/:id", postController.deletePost);

module.exports = router;
