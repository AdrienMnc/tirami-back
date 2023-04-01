const express = require("express");
const router = express.Router();
const pictureController = require("../controllers/pictureController");

// Route pour enregistrer une photo (POST)
router.post("/", pictureController.createPicture);

// Route pour récupérer les photos liées à un post (GET)
router.get("/post/:id", pictureController.getPicturesByPost);

// Route pour récupérer la photo de profil d'un utilisateur (GET)
router.get("/profile/:id", pictureController.getProfilePicture);

module.exports = router;
