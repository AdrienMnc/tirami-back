const { PrismaClient } = require("@prisma/client");
const {
  generateTokenForUser,
  getUserRole,
  getUserId,
  checkPasswordFormat,
  generateTempToken,
  verifyTempToken,
} = require("../lib/functions");
const mailer = require("../lib/mailer");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

module.exports = {
  /**
   * Récupérer tous les utilisateurs
   */
  getAllUsers: async (req, res) => {
    const users = await prisma.user.findMany();
    if (!users) {
      return res.status(400).json({ message: "No users found" });
    }
    res.status(200).json(users);
  },

  /**
   * Récupérer un utilisateur par ID
   */
  getOneUser: async (req, res) => {
    const loggedUserRole = getUserRole(req);
    const { id } = getUserId(req);
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }
    if (
      loggedUserRole === "ADMIN" ||
      loggedUserRole === "MODO" ||
      id === getUserId(req)
    ) {
      res.status(200).json(user);
    } else {
      res.status(200).json({ username: user.username });
    }
  },

  /**
   * Création de l'utilisateur
   */
  createUser: async (req, res) => {
    const { username, email, password } = req.body;
    if (!checkPasswordFormat(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters, one uppercase, one lowercase and one number",
      });
    }
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      // Créer un token temporaire pour valider l'adresse email
      const tempToken = generateTempToken(email, username);
      // Try la fonction sendConfirmationEmail pour valider la création du compte
      try {
        await mailer.sendConfirmationEmail(email, username, tempToken);
      } catch (error) {
        return res.status(400).json({ message: "Email not sent" });
      }
      const newUser = await prisma.user.create({
        data: {
          username: username,
          email: email,
          password: hashedPassword,
        },
      });
      if (!newUser) {
        return res.status(400).json({ message: "User not created" });
      }
      res.status(201).json({ message: "User created", newUser });
    } else {
      res.status(400).json({ message: "User already exists" });
    }
  },

  /**
   * Activation du compte après avoir cliqué sur le lien de confirmation dans l'email
   */
  activateUser: async (req, res) => {
    const { token } = req.params;
    // Vérifier le token
    const { email, username } = verifyTempToken(token);
    if (!email || !username) {
      return res.status(400).json({ message: "Invalid token" });
    }
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    // Vérifier si l'utilisateur est déjà activé
    if (user.verified === true) {
      return res.status(400).json({ message: "User already activated" });
    }
    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        verified: true,
      },
    });
    if (!updatedUser) {
      return res.status(400).json({ message: "User not activated" });
    }
    res.status(200).json({ message: "User activated" });
    // Connecter l'utilisateur et lui renvoyer un token
    const newToken = generateTokenForUser(updatedUser);
    res.status(200).json({ message: "User logged in", newToken });
  },

  /**
   *  Connexion de l'utilisateur
   */
  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (user && user.deactivated === false) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const token = generateTokenForUser(user);
      res.status(200).json({ message: "User logged in", token });
    } else {
      res.status(400).json({ message: "User not found" });
    }
  },

  /**
   *  Mettre à jour un utilisateur
   */
  updateUser: async (req, res) => {
    const { id } = getUserId(req);
    const { username, email, password, profile_pic_id } = req.body;
    // Récupérer l'utilisateur à modifier
    const userToModify = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    // Comparer le mot de passe reçu avec le hash en base de données
    if (!comparePassword(password, userToModify.password)) {
      return res.status(400).json({ message: "Invalid password" });
    }
    // Vérifier que le nouveau nom d'utilisateur n'est pas déjà pris
    const usernameAlreadyExists = await prisma.user.findFirst({
      where: {
        username: username,
      },
    });
    if (usernameAlreadyExists && usernameAlreadyExists.id != id) {
      return res.status(400).json({ message: "Username already exists" });
    }
    // Vérifier que le nouveau mail n'est pas déjà pris
    const emailAlreadyExists = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (emailAlreadyExists && emailAlreadyExists.id != id) {
      return res.status(400).json({ message: "Email already exists" });
    }
    // Vérifier que le nouveau mot de passe a un format valide
    if (!checkPasswordFormat(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters, one uppercase, one lowercase and one number",
      });
    }
    // Mettre à jour l'utilisateur avec les nouvelles données (username, email, password)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: {
        username: username,
        email: email,
        password: hashedPassword,
        // Mettre à jour la photo de profil : dans la table "pictures", passer profile_pic à true pour la photo dont l'id est dans le body
        pictures: {
          update: {
            where: {
              id: parseInt(profile_pic_id),
            },
            data: {
              profile_pic: true,
            },
          },
        },
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User not updated" });
    }
    res.status(200).json({ message: "User updated", user });
  },

  /**
   * Supprimer un utilisateur après vérification du token et du mot de passe
   */
  deleteUser: async (req, res) => {
    const loggedUserRole = getUserRole(req);
    let deletedUser;
    const { id } = getUserId(req);
    const { password, keepContent } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (loggedUserRole == "ADMIN" || loggedUserRole == "MODO") {
      deletedUser = await prisma.user.update({
        where: {
          id: parseInt(id),
        },
        data: {
          deactivated: true,
          deactivated_at: new Date(),
        },
      });
    } else {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      deletedUser = await prisma.user.update({
        where: {
          id: parseInt(id),
        },
        data: {
          deactivated: true,
          deactivated_at: new Date(),
        },
      });
    }
    if (!deletedUser) {
      return res.status(400).json({ message: "User not deactivated" });
    }
    if (keepContent == false) {
      // Passer les posts de l'utilisateur à deactivated = true
      const posts = await prisma.post.updateMany({
        where: {
          user_id: parseInt(id),
        },
        data: {
          deactivated: true,
          deactivated_at: new Date(),
        },
      });
    }
    // Passer author_deactivated à true pour les commentaires des posts de l'utilisateur
    const comments = await prisma.comment.updateMany({
      where: {
        post: {
          user_id: parseInt(id),
        },
      },
      data: {
        author_deactivated: true,
      },
    });
    res.status(200).json({ message: "User deactivated", deletedUser });
  },

  /**
   * Récupérer tous les posts d'un utilisateur
   */
  getAllPostsFromUser: async (req, res) => {
    const { id } = getUserId(req);
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        posts: true,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }
    res.status(200).json(user.posts);
  },
};
