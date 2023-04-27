// Middleware de vérification

const { getUserId, getUserRole } = require("../lib/functions");

module.exports = {
  async isAuthenticated(req, res, next) {
    try {
      await getUserId(req);
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

  // Fonction de validation des données dans tous les formulaires de création et de modification de l'app
  validatePost(req, res, next) {
    try {
      const { content } = req.body;
      if (content.length <= 0 || content.length > 255) {
        throw "Invalid data";
      }
      next();
    } catch (err) {
      res.status(400).json({ message: err });
    }
  },
};
