const express = require("express");
const router = express.Router();

//say hello
router.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = router;
