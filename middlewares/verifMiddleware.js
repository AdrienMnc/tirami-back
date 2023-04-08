// Middleware de vérification
const jwt = require("jsonwebtoken");

// require functions.js
const { getUserId, getUserRole } = require("../functions");

module.exports = {
  isAuthenticated(req, res, next) {
    try {
      const userId = getUserId(req);
      if (req.body.userId !== userId) {
        throw "Invalid user ID";
      }
      next();
    } catch (err) {
      res.status(401).json({ message: err });
    }
  },

  isModeratorOrAdmin(req, res, next) {
    try {
      const role = getUserRole(req);
      if (role !== "MODO" && role !== "ADMIN") {
        throw "Unauthorized";
      }
      next();
    } catch (err) {
      res.status(401).json({ message: err });
    }
  },

  isAdmin(req, res, next) {
    try {
      const role = getUserRole(req);
      if (role !== "ADMIN") {
        throw "Unauthorized";
      }
      next();
    } catch (err) {
      res.status(401).json({ message: err });
    }
  },
};
