const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Route pour récupérer tous les utilisateurs (GET)
router.get("/", userController.getAllUsers);

// Route pour créer un nouvel utilisateur (POST)
router.post("/", userController.createUser);

// Route pour se connecter (POST)
router.post("/login", userController.login);

// Route pour récupérer un utilisateur par ID (GET)
router.get("/:id", userController.getOneUser);

// Route pour mettre à jour un utilisateur (PUT)
router.put("/:id", userController.updateUser);

// Route pour supprimer un utilisateur (DELETE)
router.delete("/:id", userController.deleteUser);

module.exports = router;
