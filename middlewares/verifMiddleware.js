// Middleware de vérification

const { getUserId, getUserRole } = require("../lib/functions");

module.exports = {
  async isAuthenticated(req, res, next) {
    try {
      const id = await getUserId(req);
      req.userId = id; // Ajoute l'id de l'utilisateur à l'objet req pour une utilisation ultérieure
      next();
    } catch (error) {
      if (error.message === "Invalid token") {
        res.status(401).json({ message: "Token invalide" });
      } else if (error.message === "Invalid token type") {
        res.status(401).json({ message: "Type de token invalide" });
      } else {
        res.status(401).json({ message: "Non autorisé" });
      }
    }
  },

  /**
   * Middleware de vérification pour le rôle de modérateur ou administrateur
   */
  async isModeratorOrAdmin(req, res, next) {
    try {
      const role = await getUserRole(req);
      if (role !== "MODO" && role !== "ADMIN") {
        throw "Unauthorized";
      }
      next();
    } catch (err) {
      res.status(401).json({ message: err });
    }
  },

  /**
   * Middleware de vérification pour le rôle d'administrateur
   */
  async isAdmin(req, res, next) {
    try {
      const role = await getUserRole(req);
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
