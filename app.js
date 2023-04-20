const express = require("express");
const app = express();

app.use(express.json());

// Import des routes
const test = require("./routes/test");

const userRoutes = require("./routes/userRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const postRoutes = require("./routes/postRoutes");
const dessertRoutes = require("./routes/dessertRoutes");
const pictureRoutes = require("./routes/pictureRoutes");

// Import des middlewares
const verifMiddleware = require("./middlewares/verifMiddleware");

//Liste des routes

// Routes publiques
/**
 * accueil
 * inscription
 * connexion
 * mot de passe oublié
 */
app.use("/user", userRoutes);

// Routes protégées : authentification requise
/**
 * profil
 * déconnexion
 * modifier le profil
 * supprimer le profil
 *
 */

// Routes protégées : authentification requise + rôle MODO ou ADMIN

// Routes protégées : authentification requise + rôle ADMIN

module.exports = app;
