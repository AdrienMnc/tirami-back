const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifMiddleware = require("../middlewares/verifMiddleware");

// Route pour récupérer tous les utilisateurs (GET)
router.get("/", userController.getAllUsers);

// Route pour créer un nouvel utilisateur (POST)
router.post("/create", userController.createUser);

// Route pour activer un compte utilisateur (GET)
router.get("/activate/:token", userController.activateUser);

// Route pour se connecter (POST)
router.post("/login", userController.login);

// Route pour récupérer un utilisateur par ID (GET)
router.get(
  "/display",
  verifMiddleware.isAuthenticated || verifMiddleware.isModeratorOrAdmin,
  userController.getOneUser
);

// Route pour mettre à jour un utilisateur (PUT)
router.put(
  "/update",
  verifMiddleware.isAuthenticated,
  userController.updateUser
);

// Route pour supprimer un utilisateur (DELETE)
router.delete(
  "/delete",
  verifMiddleware.isAuthenticated,
  userController.deleteUser
);

module.exports = router;
