const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const {
  generateTokenForUser,
  generateRefreshTokenForUser,
  invalidateToken,
  getUserRole,
  getUserId,
  getToken,
  checkPasswordFormat,
  generateTempToken,
  verifyTempToken,
  comparePassword,
  sanitizeInput,
  prepareEmailAndUsername,
} = require("../lib/functions");
const mailer = require("../lib/mailer");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const validator = require("validator");

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
   * Récupérer un utilisateur connecté
   */
  getOneUser: async (req, res) => {
    console.log("entré dans getOneUser");
    const loggedUserRole = await getUserRole(req);
    const id = await getUserId(req);
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }
    res.status(200).json(user);
  },

  /**
   * Création de l'utilisateur
   */
  createUser: async (req, res) => {
    const { username, email, password } = req.body;
    // Vérifier si les paramètres sont présents
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing parameters" });
    }
    // Empêcher l'utilisateur de choisir son rôle
    if (req.body.role) {
      return res.status(400).json({ message: "Invalid parameter given" });
    }
    // Vérifier le format de l'email à l'aide de la librairie validator
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    // Vérifier le format du mot de passe
    if (!checkPasswordFormat(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters, one uppercase, one lowercase and one number",
      });
    }
    // Préparer l'email et l'username
    const { email: sanitizedEmail, username: sanitizedUsername } =
      prepareEmailAndUsername(email, username);

    // Vérifier si l'utilisateur existe déjà
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: sanitizedEmail }, { username: sanitizedUsername }],
      },
    });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      // Création d'un token temporaire pour la validation de l'adresse email
      const tempToken = generateTempToken(email, username);
      try {
        await mailer.sendConfirmationEmail(
          sanitizedEmail,
          sanitizedUsername,
          tempToken
        );
      } catch (error) {
        return res.status(400).json({ message: "Email not sent", error });
      }
      const newUser = await prisma.user.create({
        data: {
          username: sanitizedUsername,
          email: sanitizedEmail,
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
  // À modifier pour une version à code de confirmation au lieu de lien
  activateUser: async (req, res) => {
    const { token } = req.params;
    // Vérifier le token
    const { email } = verifyTempToken(token);
    if (!email) {
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
    // Connecter l'utilisateur et lui renvoyer un token
    const newToken = generateTokenForUser(updatedUser);
    res.status(200).json({ message: "User activated and logged in", newToken });
  },

  /**
   *  Connexion de l'utilisateur
   */
  login: async (req, res) => {
    console.log("entré dans login");
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }
    // Vérifier le format de l'email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    // Préparer l'email et l'username
    const sanitizedEmail = sanitizeInput(email);

    const user = await prisma.user.findUnique({
      where: {
        email: sanitizedEmail,
      },
    });
    if (user && user.deactivated === false) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const token = generateTokenForUser(user);
      const refreshToken = generateRefreshTokenForUser(user);

      res.status(200).json({ message: "User logged in", token, refreshToken });
    } else {
      res.status(400).json({ message: "User not found" });
    }
  },

  /**
   *  Se déconnecter en invalidant le token et le refresh token
   */

  logout: async (req, res) => {
    console.log("entré dans logout");
    try {
      // Vérification de l'en-tête Authorization
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return res.status(400).json({ message: "Invalid token" });
      }

      // Récupérer le token
      // const token = authorizationHeader.split(" ")[1];
      let token;
      try {
        token = await getToken(req);
      } catch (error) {
        throw new Error("Unauthorized");
      }
      console.log("token", token);

      // Vérification du refresh token
      const refreshToken = req.body.refreshToken;
      console.log("refreshToken", refreshToken);
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token not provided" });
      }

      // Enregistrement des tokens dans la table invalidToken
      const invalidTokenCreated = await invalidateToken(token);
      const invalidRefreshTokenCreated = await invalidateToken(refreshToken);

      if (!invalidTokenCreated || !invalidRefreshTokenCreated) {
        return res.status(400).json({ message: "Token not invalidated" });
      }

      res.status(200).json({
        message: "Tokens invalidated",
        invalidTokenCreated,
        invalidRefreshTokenCreated,
      });
      console.log("invalidation ok");
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  /**
   *  Mettre à jour un utilisateur
   */
  updateUser: async (req, res) => {
    try {
      const id = await getUserId(req);
      const { username, email, newPassword, oldPassword, profile_pic_id } =
        req.body;
      // Préparer l'email et l'username
      const sanitizedData = prepareEmailAndUsername(email, username);
      const sanitizedEmail = sanitizedData.email;
      const sanitizedUsername = sanitizedData.username;

      // Récupérer l'utilisateur à modifier si on a bien récupéré son id
      const userToModify = await prisma.user.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      if (!userToModify) {
        return res.status(400).json({ message: "User not found" });
      }
      // Vérifier que l'utilisateur est bien vérifié
      if (userToModify.verified === false) {
        return res.status(400).json({ message: "User not activated" });
      }
      // Vérifier que l'utilisateur n'est pas désactivé
      if (userToModify.deactivated === true) {
        return res.status(400).json({ message: "User deactivated" });
      }
      // Vérifier que l'utilisateur n'est pas banni
      if (userToModify.banned === true) {
        return res.status(400).json({ message: "User banned" });
      }

      // Comparer le mot de passe d'origine reçu avec le hash en base de données
      if (!comparePassword(oldPassword, userToModify.password)) {
        return res.status(400).json({ message: "Invalid password" });
      }
      // Vérifier que le nouveau nom d'utilisateur n'est pas déjà pris
      const usernameAlreadyExists = await prisma.user.findFirst({
        where: {
          username: sanitizedUsername,
        },
      });
      if (usernameAlreadyExists && usernameAlreadyExists.id != id) {
        console.log(
          "usernameAlreadyExists id---------------",
          usernameAlreadyExists.id
        );
        return res.status(400).json({ message: "Username already exists" });
      }
      // Vérifier que le nouveau mail n'est pas déjà pris
      const userWithThisEmail = await prisma.user.findFirst({
        where: {
          email: sanitizedEmail,
        },
      });
      // Si l'utilisateur a fourni un email, vérifier qu'il n'est pas déjà pris par un autre utilisateur
      if (email) {
        if (userWithThisEmail && userWithThisEmail.id != id) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Si on a un nouveau mot de passe, vérifier que le nouveau mot de passe a un format valide
      if (newPassword && !checkPasswordFormat(newPassword)) {
        return res.status(400).json({
          message:
            "Password must contain at least 8 characters, one uppercase, one lowercase and one number",
        });
      }
      // Mettre à jour l'utilisateur avec les nouvelles données (username, email, password)
      // si l'utilisateur a fourni un nouveau mot de passe, hasher le nouveau mot de passe
      let user;
      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user = await prisma.user.update({
          where: {
            id: parseInt(id),
          },
          data: {
            username: sanitizedUsername,
            email: sanitizedEmail,
            password: hashedPassword,
          },
        });
      } else {
        user = await prisma.user.update({
          where: {
            id: parseInt(id),
          },
          data: {
            username: sanitizedUsername,
            email: sanitizedEmail,
          },
        });
      }
      if (!user) {
        return res.status(400).json({ message: "User not updated" });
      }
      //Si l'utilisateur a fourni un nouveau profile_pic_id, mettre à jour le statut de la nouvelle photo de profil et de l'ancienne
      if (profile_pic_id) {
        const oldProfilePic = await prisma.picture.update({
          where: {
            owner_id: parseInt(id),
          },
          data: {
            profile_pic: false,
          },
        });
        const newProfilePic = await prisma.picture.update({
          where: {
            id: parseInt(profile_pic_id),
          },
          data: {
            profile_pic: true,
          },
        });
      }
      // Si tout s'est bien passé, renvoyer un message de succès
      res.status(200).json({ message: "User updated", user });
      // Si l'utilisateur n'a pas été mis à jour, renvoyer une erreur
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "User not updated" });
    }
  },

  /**
   * Mot de passe oublié : envoi d'un email avec un token temporaire
   */
  forgotPassword: async (req, res) => {
    const { email } = req.body;
    // Vérifier que l'email est bien fourni
    if (!email) {
      return res.status(400).json({ message: "Email not provided" });
    }
    // Sanitization de l'email
    const sanitizedEmail = sanitize(email);
    // Vérifier que l'email a un format valide
    if (!checkEmailFormat(sanitizedEmail)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: {
        email: sanitizedEmail,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    // Si l'utilisateur existe, générer un token temporaire avec le mail de l'utilisateur
    const token = generateTempToken(sanitizedEmail);
    // Try la fonction sendResetPasswordEmail pour valider la création du compte
    try {
      await mailer.sendResetPasswordEmail(sanitizedEmail, token);
    } catch (error) {
      return res.status(400).json({ message: "Email not sent" });
    }
    // Si tout s'est bien passé, renvoyer un message de succès
    res.status(200).json({ message: "Email sent" });
  },

  /**
   * Mot de passe oublié : reset du mot de passe
   */
  resetPassword: async (req, res) => {
    console.log("entré dans resetPassword");
    const { token } = req.params;
    // utiliser verifyTempToken pour vérifier que le token est valide
    const { email } = verifyTempToken(token);
    // Sanitization de l'email et mise en minuscules
    const sanitizedEmail = sanitize(email).toLowerCase();

    // Vérifier que l'email a un format valide
    if (!checkEmailFormat(sanitizedEmail)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const { password } = req.body;
    // Vérifier que le mot de passe est bien fourni
    if (!password) {
      return res.status(400).json({ message: "Password not provided" });
    }

    if (!email) {
      return res.status(400).json({ message: "Invalid token" });
    }
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: {
        email: sanitizedEmail,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
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
    try {
      await prisma.user.update({
        where: {
          email: sanitizedEmail,
        },
        data: {
          password: hashedPassword,
        },
      });
    } catch (error) {
      return res.status(400).json({ message: "Password not updated" });
    }
    // Si tout s'est bien passé, renvoyer un message de succès
    res.status(200).json({ message: "Password updated" });
  },

  /**
   * Désactiver un utilisateur après vérification du token et du mot de passe
   */
  deactivateUser: async (req, res) => {
    const loggedUserRole = await getUserRole(req);
    let deactivatedUser;
    const id = await getUserId(req);
    const { password, keepContent } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (loggedUserRole == "ADMIN" || loggedUserRole == "MODO") {
      deactivatedUser = await prisma.user.update({
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
      deactivatedUser = await prisma.user.update({
        where: {
          id: parseInt(id),
        },
        data: {
          deactivated: true,
          deactivated_at: new Date(),
        },
      });
    }
    if (!deactivatedUser) {
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
      // Pour chaque post, actualiser le nombre de posts du restaurant et sa note moyenne
      const postsFromUser = await prisma.post.findMany({
        where: {
          user_id: parseInt(id),
        },
      });
      for (let i = 0; i < postsFromUser.length; i++) {
        const post = postsFromUser[i];
        const restaurant = await prisma.restaurant.findUnique({
          where: {
            id: post.restaurant_id,
          },
        });
        // Recalculer la note moyenne du restaurant en fonction de la note du post et du nombre de posts actifs
        const averageRating = calculateAverageRating(post.restaurant_id);
        const updatedRestaurant = await prisma.restaurant.update({
          where: {
            id: post.restaurant_id,
          },
          data: {
            commentCount: restaurant.commentCount - 1,
            averageRating: averageRating,
          },
        });
      }

      // Passer les likes de l'utilisateur à deactivated = true
      const likes = await prisma.like.updateMany({
        where: {
          user_id: parseInt(id),
        },
        data: {
          deactivated: true,
          deactivated_at: new Date(),
        },
      });

      // Passer les follows de l'utilisateur à deactivated = true
      const follows = await prisma.follow.updateMany({
        where: {
          follower_id: parseInt(id),
        },
        data: {
          deactivated: true,
          deactivated_at: new Date(),
        },
      });

      // Passer les photos de l'utilisateur à deactivated = true
      const pictures = await prisma.picture.updateMany({
        where: {
          user_id: parseInt(id),
        },
        data: {
          deactivated: true,
          deactivated_at: new Date(),
        },
      });
    }
    res.status(200).json({ message: "User deactivated", deactivatedUser });
  },

  /**
   * Supprimer un utilisateur
   */
  deleteUser: async (req, res) => {
    const loggedUserRole = getUserRole(req);
    const { id } = getUserId(req);
    const { password } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (loggedUserRole == "ADMIN" || loggedUserRole == "MODO") {
      deletedUser = await prisma.user.delete({
        where: {
          id: parseInt(id),
        },
      });
    } else {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      deletedUser = await prisma.user.delete({
        where: {
          id: parseInt(id),
        },
      });
    }
    if (!deletedUser) {
      return res.status(400).json({ message: "User not deleted" });
    }
    // Supprimer les posts de l'utilisateur
    const posts = await prisma.post.deleteMany({
      where: {
        user_id: parseInt(id),
      },
    });

    // Pour chaque post supprimé, actualiser le nombre de posts du restaurant et sa note moyenne
    const postsFromUser = await prisma.post.findMany({
      where: {
        user_id: parseInt(id),
      },
    });
    for (let i = 0; i < postsFromUser.length; i++) {
      const post = postsFromUser[i];
      const restaurant = await prisma.restaurant.findUnique({
        where: {
          id: post.restaurant_id,
        },
      });
      // Recalculer la note moyenne du restaurant en fonction de la note du post et du nombre de posts actifs
      const averageRating = calculateAverageRating(post.restaurant_id);
      const updatedRestaurant = await prisma.restaurant.update({
        where: {
          id: post.restaurant_id,
        },
        data: {
          commentCount: restaurant.commentCount - 1,
          averageRating: averageRating,
        },
      });
    }

    // Supprimer les follows de l'utilisateur
    const follows = await prisma.follow.deleteMany({
      where: {
        follower_id: parseInt(id),
      },
    });

    // Supprimer les likes de l'utilisateur
    const likes = await prisma.like.deleteMany({
      where: {
        user_id: parseInt(id),
      },
    });
    // Supprimer les photos de l'utilisateur
    const pictures = await prisma.picture.deleteMany({
      where: {
        user_id: parseInt(id),
      },
    });
    res.status(200).json({ message: "User deleted", deletedUser });
  },

  /**
   * Récupérer tous les posts d'un utilisateur
   */
  getAllPostsFromUser: async (req, res) => {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        posts: {
          include: {
            post_pics: true,
            restaurant: {
              select: {
                name: true,
              },
            },
          },
        },
        post_pics: true,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }
    res.status(200).json(user.posts);
  },

  /**
   * Récupérer tous les restaurants favoris de l'utilisateur connecté
   */
  getAllFavoriteRestaurantsFromUser: async (req, res) => {
    const id = await getUserId(req);
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        favorite_restaurants: true,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }
    res.status(200).json(user.favorite_restaurants);
  },
};
