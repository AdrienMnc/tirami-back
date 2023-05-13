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

app.use("/user", userRoutes);

app.use("/restaurant", restaurantRoutes);

app.use("/post", postRoutes);

module.exports = app;
