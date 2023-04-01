const express = require("express");
const app = express();

app.use(express.json());

//Import des routes
const test = require("./routes/test");
const userRoutes = require("./routes/userRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");

//Liste des routes
app.use("/test", test);
app.use("/user", userRoutes);
// app.use("/restaurant", restaurantRoutes);

module.exports = app;
