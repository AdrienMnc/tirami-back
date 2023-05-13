const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { calculateAverageRating, getUserId } = require("../lib/functions");

module.exports = {
  // Créer un nouveau post (Post : content, author_id, restaurant_id,  dessert_id)
  createPost: async (req, res) => {
    const { content, rating, restaurant_id, dessert_id } = req.body;
    // Récupérer l'id de l'auteur du post dans le token
    const author_id = await getUserId(req);
    console.log("ID auteur : " + author_id);
    console.log("Contenu : " + content);
    console.log("restaurant ID : " + restaurant_id);
    console.log("Dessert ID : " + dessert_id);
    const post = await prisma.post.create({
      data: {
        content: content,
        rating: rating,
        author: {
          connect: {
            id: author_id,
          },
        },

        restaurant: {
          connect: {
            id: restaurant_id,
          },
        },

        dessert: {
          connect: {
            id: dessert_id,
          },
        },
      },
    });
    if (!post) {
      return res.status(400).json({ message: "Post not created" });
    }
    // Mettre à jour le nombre de posts du restaurant (postCount) et sa note moyenne (averageRating)
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurant_id,
      },
    });
    // Recalculer la note moyenne du restaurant en fonction de la note du post et du nombre de posts actifs
    const averageRating = await calculateAverageRating(restaurant_id);
    console.log("averageRating : " + averageRating);

    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        id: restaurant_id,
      },
      data: {
        postCount: restaurant.postCount + 1,
        averageRating: averageRating,
      },
    });
    if (!updatedRestaurant) {
      return res.status(400).json({ message: "Restaurant not updated" });
    }
    res
      .status(201)
      .json({ message: "Post created and restaurant updated", post });
  },

  // UTILISER L'ID DE L'API EXTERNE POUR AFFICHER LES POSTS D'UN RESTAURANT -------------------------------------------------- à compléter après avoir géré l'API restaurants
  // Récupérer tous les posts pour un restaurant (doublon avec la méthode du restaurantController)
  getAllPostsForOneRestaurant: async (req, res) => {
    const { id } = req.params;
    const posts = await prisma.post.findMany({
      where: {
        restaurant_id: parseInt(id),
        deactivated: false,
      },
      // Récupérer l'auteur du post si user.keepContent est true
      include: {
        user: {
          where: {
            keepContent: true,
          },
          select: {
            username: true,
            picture: {
              select: {
                url: true,
              },
              where: {
                profile_pic: true,
              },
            },
          },
        },
        post_pics: true,
      },
    });
    if (!posts) {
      return res.status(400).json({ message: "No posts found" });
    }
    res.status(200).json(posts);
  },

  // Récupérer un post par ID et le renvoyer avec les photos associées (utilisé lorsqu'un utilisateur veut afficher son post pour le modifier)
  getOnePost: async (req, res) => {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        post_pics: true,
      },
    });
    if (!post) {
      return res.status(400).json({ message: "No post found" });
    }
    res.status(200).json(post);
  },

  // Mettre à jour un post
  updatePost: async (req, res) => {
    const { id } = req.params;
    const { content, rating } = req.body;
    // Récupérer le post
    const post = await prisma.post.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!post) {
      return res.status(400).json({ message: "No post found" });
    }
    // Vérifier que l'utilisateur est bien l'auteur du post
    if (post.author_id !== req.user.id) {
      return res.status(400).json({ message: "You are not the author" });
    }
    // Comparer post.rating et req.body.rating
    if (post.rating !== req.body.rating) {
      // Si les notes sont différentes, mettre à jour la note du post
      const updatedPost = await prisma.post.update({
        where: {
          id: parseInt(id),
        },
        data: {
          content: content,
          rating: rating,
        },
      });
      if (!updatedPost) {
        return res.status(400).json({ message: "post not updated" });
      }
      // Mettre à jour la note moyenne du restaurant
      const restaurant = await prisma.restaurant.findUnique({
        where: {
          id: post.restaurant_id,
        },
      });
      // Recalculer la note moyenne du restaurant en fonction de la note du post et du nombre de posts
      const averageRating = await calculateAverageRating(post.restaurant_id);
      const updatedRestaurant = await prisma.restaurant.update({
        where: {
          id: post.restaurant_id,
        },
        data: {
          averageRating: averageRating,
        },
      });
      if (!updatedRestaurant) {
        return res.status(400).json({ message: "Restaurant not updated" });
      }
      res.status(200).json({ message: "post updated", post });
    } else {
      // Si les notes sont identiques, mettre à jour le post sans mettre à jour la note moyenne du restaurant
      const updatedPost = await prisma.post.update({
        where: {
          id: parseInt(id),
        },
        data: {
          content: content,
        },
      });
      if (!updatedPost) {
        return res.status(400).json({ message: "post not updated" });
      }
      res.status(200).json({ message: "post updated", post });
    }
  },

  // Désactiver un post
  deactivatePost: async (req, res) => {
    const { id } = req.params;
    const post = await prisma.post.update({
      where: {
        id: parseInt(id),
      },
      data: {
        deactivated: true,
      },
    });
    if (!post) {
      return res.status(400).json({ message: "post not deactivated" });
    }
    // Récupérer le restaurant lié pour mettre à jour le nombre de posts (postCount) et sa note moyenne (averageRating)
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: post.restaurant_id,
      },
    });
    // Recalculer la note moyenne du restaurant en fonction de la note du post et du nombre de posts
    const averageRating = await calculateAverageRating(post.restaurant_id);
    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        id: post.restaurant_id,
      },
      data: {
        postCount: restaurant.postCount - 1,
        averageRating: averageRating,
      },
    });
    if (!updatedRestaurant) {
      return res.status(400).json({ message: "Restaurant not updated" });
    }
    res
      .status(200)
      .json({ message: "Post deactivated and restaurant updated", post });
  },

  // Supprimer un post
  deletePost: async (req, res) => {
    const { id } = req.params;
    const post = await prisma.post.delete({
      where: {
        id: parseInt(id),
      },
    });
    if (!post) {
      return res.status(400).json({ message: "Post not deleted" });
    }
    // Chercher les photos associées au post et les supprimer
    const postPics = await prisma.post_pic.deleteMany({
      where: {
        post_id: parseInt(id),
      },
    });
    if (!postPics) {
      return res.status(400).json({ message: "Post pics not deleted" });
    }
    // Récupérer le restaurant lié pour mettre à jour le nombre de posts (postCount) et sa note moyenne (averageRating)
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: post.restaurant_id,
      },
    });
    // Recalculer la note moyenne du restaurant en fonction de la note du post et du nombre de posts
    const averageRating = await calculateAverageRating(post.restaurant_id);
    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        id: post.restaurant_id,
      },
      data: {
        postCount: restaurant.postCount - 1,
        averageRating: averageRating,
      },
    });
    if (!updatedRestaurant) {
      return res.status(400).json({ message: "Restaurant not updated" });
    }
    res
      .status(200)
      .json({ message: "Post deleted and restaurant updated", post });
  },
};
