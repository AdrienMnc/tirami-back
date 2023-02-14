const express = require("express");
const app = express();

// import routes and controllers here
const test = require("./routes/test");

//define routes here
app.use("/test", test);

//define controllers here

module.exports = app;
