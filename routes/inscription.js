const express = require("express");
const router = express.Router();
const inscriptionController = require("./controllers/inscriptionController");

router.post("/", inscriptionController);

module.exports = router;
