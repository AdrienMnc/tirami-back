const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Ajouter une mention "like" à un post : créer une entrée dans la table like (fait le lien entre un utilisateur et un post)
  createLike: async (req, res) => {
    const { user_id, post_id } = req.body;
    const like = await prisma.like.create({
      data: {
        user_id: user_id,
        post_id: post_id,
      },
    });
    if (!like) {
      return res.status(400).json({ message: "Like not created" });
    }
    res.status(201).json({ message: "Like created", like });
  },

  // Enlever la mention "like" d'un post : supprimer l'entrée dans la table like
  deleteLike: async (req, res) => {
    const { id } = req.params;
    const like = await prisma.like.delete({
      where: {
        id: parseInt(id),
      },
    });
    if (!like) {
      return res.status(400).json({ message: "Like not deleted" });
    }
    res.status(200).json({ message: "Like deleted", like });
  },
};
