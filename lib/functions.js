const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
  // Verifier que le token n'est pas dans la table invalidToken
  const invalidToken = await prisma.invalidToken.findFirst({
    where: {
      token: token,
    },
  });
  // Si le token est dans la table invalidToken, renvoyer une erreur 401 Unauthorized pour que le front renvoie le refresh token s'il est différent du token testé
  if (invalidToken) {
    res.status(401).json({ message: "Invalid token", token: invalidToken });
    return;
  }
  // Si le token n'est pas de type Bearer, renvoyer une erreur
  const [type, value] = token.split(" ");
  if (type !== "Bearer") throw "Invalid token type";
  return value;
}
// Fonction de récupération de l'id de l'utilisateur
async function getUserId(req) {
  try {
    const token = await getToken(req);
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return decoded.id;
  } catch (error) {
    console.log(error);
  }
}

// Fonction de récupération du rôle de l'utilisateur
async function getUserRole(req) {
  const token = await getToken(req);
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  return decoded.role;
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
  // Verifier que le refresh token n'est pas dans la table invalidToken
  const invalidToken = await prisma.invalidToken.findFirst({
    where: {
      token: refreshToken,
    },
  });
  if (invalidToken) {
    res.status(401).json({ message: "Invalid token", token: invalidToken });
    return;
  }
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
function generateTempToken(email) {
  return jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

// Fonction de vérification du token temporaire
function verifyTempToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET_KEY);
}

// Fonction pour enregistrer le token dans la table invalidToken
async function invalidateToken(token) {
  const invalidToken = await prisma.invalidToken.create({
    data: {
      token: token,
    },
  });
  return invalidToken;
}

// Fonction de vérification du mot de passe : 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
function checkPasswordFormat(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
  return regex.test(password);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function calculateAverageRating(restaurant_id) {
  return prisma.post.aggregate({
    where: {
      restaurant_id: restaurant_id,
    },
    avg: {
      rating: true,
    },
  });
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
  calculateAverageRating,
};
