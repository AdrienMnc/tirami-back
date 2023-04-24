const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Fonction pour générer un token
function generateTokenForUser(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
}

// Fonction de récupération du token
async function getToken(req) {
  const token = req.headers.authorization;
  if (!token) throw "No token provided";
  // Verifier que le token n'est pas dans la table invalid_tokens
  const invalidToken = await prisma.invalid_tokens.findFirst({
    where: {
      token: token,
    },
  });
  if (invalidToken) throw "Invalid token";
  // Si le token est expiré envoyer une requète pour récup le refresh token
  const [type, value] = token.split(" ");
  if (type !== "Bearer") throw "Invalid token type";
  return value;
}

// Fonction de génération d'un refresh token
function generateRefreshTokenForUser(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_REFRESH_SECRET_KEY,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    }
  );
}

// Fonction qui vérifie le refresh token : si le refresh token est valide, renvoyer un nouveau token standard
async function verifyRefreshToken(req, res) {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) throw "No refresh token provided";
  // Verifier que le refresh token n'est pas dans la table invalid_tokens
  const invalidToken = await prisma.invalid_tokens.findFirst({
    where: {
      token: refreshToken,
    },
  });
  if (invalidToken) throw "Invalid refresh token";
  const [type, value] = refreshToken.split(" ");
  if (type !== "Bearer") throw "Invalid refresh token type";
  const decoded = jwt.verify(value, process.env.JWT_REFRESH_SECRET_KEY);
  const user = await prisma.user.findUnique({
    where: {
      id: decoded.id,
    },
  });
  if (!user) throw "User not found";
  const token = generateTokenForUser(user);
  res.status(200).json({ message: "Token refreshed", token });
}

// Fonction de génération d'un token temporaire à partir d'un email et de l'username
function generateTempToken(email, username) {
  return jwt.sign({ email, username }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

// Fonction de vérification du token temporaire
function verifyTempToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET_KEY);
}

// Fonction pour enregistrer le token dans la table invalid_tokens
async function invalidateToken(token) {
  const invalidToken = await prisma.invalid_tokens.create({
    data: {
      token: token,
    },
  });
  return invalidToken;
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

// Fonction de vérification du mot de passe : 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
function checkPasswordFormat(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
  return regex.test(password);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Export des fonctions
module.exports = {
  getToken,
  getUserId,
  getUserRole,
  generateTokenForUser,
  checkPasswordFormat,
  comparePassword,
  generateTempToken,
  verifyTempToken,
  invalidateToken,
  verifyRefreshToken,
  generateRefreshTokenForUser,
};