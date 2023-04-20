const jwt = require("jsonwebtoken");

// Fonction pour générer un token
function generateTokenForUser(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );
}

// Fonction de récupération du token
function getToken(req) {
  const token = req.headers.authorization;
  if (!token) throw "No token provided";
  const [type, value] = token.split(" ");
  if (type !== "Bearer") throw "Invalid token type";
  return value;
}

// Fonction de récupération de l'id de l'utilisateur
function getUserId(req) {
  const token = getToken(req);
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  return decoded.userId;
}

// Fonction de récupération du rôle de l'utilisateur
function getUserRole(req) {
  const token = getToken(req);
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  return decoded.role;
}

// Export des fonctions
module.exports = {
  getToken,
  getUserId,
  getUserRole,
  generateTokenForUser,
};
