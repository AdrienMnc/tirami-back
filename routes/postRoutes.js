const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");

// Route pour créer un post (POST)
router.post("/", postController.createComment);

// Route pour récupérer tous les posts pour un restaurant (GET)
router.get("/:id", postController.getAllComments);

// Route pour mettre à jour un post (PUT)
router.put("/:id", postController.updateComment);

// Route pour supprimer un post (DELETE)
router.delete("/:id", postController.deleteComment);

module.exports = router;
