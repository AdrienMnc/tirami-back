const express = require("express");
const router = express.Router();

// Route pour récupérer tous les articles (GET)
router.get("/posts", (req, res) => {
  // Code pour récupérer tous les articles de la table `posts`
});

// Route pour créer un nouvel article (POST)
router.post("/posts", (req, res) => {
  // Code pour ajouter un nouvel article à la table `posts`
});

// Route pour récupérer un article par ID (GET)
router.get("/posts/:id", (req, res) => {
  // Code pour récupérer un article de la table `posts` en utilisant l'ID dans l'URL
});

// Route pour mettre à jour un article (PUT)
router.put("/posts/:id", (req, res) => {
  // Code pour mettre à jour un article dans la table `posts` en utilisant l'ID dans l'URL
});

// Route pour supprimer un article (DELETE)
router.delete("/posts/:id", (req, res) => {
  // Code pour supprimer un article de la table `posts` en utilisant l'ID dans l'URL
});

//Un commentaire

module.exports = router;
