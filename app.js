const express = require("express");
const app = express();

app.use(express.json());

//Define controllers here
const test = require("./routes/test");
const inscription = require("./controllers/inscriptionController");

//Define routes here
app.use("/test", test);
app.use("/inscription", inscription.inscriptionController);

module.exports = app;
