const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifMiddleware = require("../middlewares/verifMiddleware");

// Route pour récupérer tous les utilisateurs (GET)
router.get(
  "/all",
  verifMiddleware.isModeratorOrAdmin,
  userController.getAllUsers
);

// Route pour créer un nouvel utilisateur (POST)
router.post("/create", userController.createUser);

// Route pour activer un compte utilisateur (GET)
router.get("/activate/:token", userController.activateUser);

// Route pour se connecter (POST)
router.post("/login", userController.login);

// Route pour se déconnecter (POST)
router.post("/logout", userController.logout);

// Route pour récupérer un utilisateur par ID (GET)
router.get(
  "/my-profile",
  verifMiddleware.isAuthenticated,
  userController.getOneUser
);

// Route pour afficher les posts d'un utilisateur en particulier en utilisant son ID (GET)
router.get(
  "/:id/posts",
  verifMiddleware.isAuthenticated,
  userController.getAllPostsFromUser
);

// Route pour mettre à jour un utilisateur (PUT)
router.put(
  "/update",
  verifMiddleware.isAuthenticated,
  userController.updateUser
);

// Route pour demander un reset de mot de passe (POST)
router.post("/forgot-password", userController.forgotPassword);

// Route pour le reset de mot de passe oublié (POST)
router.post("/reset-password/:token", userController.resetPassword);

// Route pour désactiver l'utilisateur (PUT)
router.put(
  "/deactivate",
  verifMiddleware.isAuthenticated,
  userController.deactivateUser
);

// Route pour supprimer un utilisateur (DELETE)
router.delete(
  "/delete",
  verifMiddleware.isAuthenticated,
  userController.deleteUser
);

module.exports = router;
