const { PrismaClient } = require("@prisma/client");
const {
  generateTokenForUser,
  generateRefreshTokenForUser,
  invalidateToken,
  getUserRole,
  getUserId,
  checkPasswordFormat,
  generateTempToken,
  verifyTempToken,
  comparePassword,
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
   * Récupérer un utilisateur connecté
   */
  getOneUser: async (req, res) => {
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
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing parameters" });
    }
    if (req.body.role) {
      return res.status(400).json({ message: "Invalid parameter given" });
    }
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
    // récupérer le token
    const token = req.headers.authorization.split(" ")[1];
    // récupérer le refresh token
    const refreshToken = req.body.refreshToken;
    // enregistrer les tokens dans la table invalidToken
    const invalidTokenCreated = await invalidateToken(token);
    const invalidRefreshTokenCreated = await invalidateToken(refreshToken);
    if (!invalidTokenCreated || !invalidRefreshTokenCreated) {
      return res.status(400).json({ message: "Token not invalidated" });
    }
    res.status(200).json({
      message: "Token invalidated",
      invalidTokenCreated,
      invalidRefreshTokenCreated,
    });
  },

  /**
   *  Mettre à jour un utilisateur
   */
  updateUser: async (req, res) => {
    const id = await getUserId(req);
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
    const userWithThisEmail = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    // Si l'utilisateur a fourni un email, vérifier qu'il n'est pas déjà pris
    if (email) {
      if (userWithThisEmail && userWithThisEmail.id != id) {
        return res.status(400).json({ message: "Email already exists" });
      }
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
      },
    });
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
    // Si l'utilisateur n'a pas été mis à jour, renvoyer une erreur
    if (!user) {
      return res.status(400).json({ message: "User not updated" });
    }
    // Si tout s'est bien passé, renvoyer un message de succès
    res.status(200).json({ message: "User updated", user });
  },

  /**
   * Mot de passe oublié : envoi d'un email avec un token temporaire
   */
  forgotPassword: async (req, res) => {
    const { email } = req.body;
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    // Si l'utilisateur existe, générer un token temporaire avec le mail de l'utilisateur
    const token = generateTempToken(email);
    // Try la fonction sendResetPasswordEmail pour valider la création du compte
    try {
      await mailer.sendResetPasswordEmail(email, token);
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
    const { password } = req.body;

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
          email: email,
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
