const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Créer un nouveau commentaire (Post : content, author_id, restaurant_id,  dessert_id)
  createComment: async (req, res) => {
    const { content, author_id, restaurant_id, dessert_id } = req.body;
    const comment = await prisma.comment.create({
      data: {
        content: content,
        author_id: author_id,
        restaurant_id: restaurant_id,
        dessert_id: dessert_id,
      },
    });
    if (!comment) {
      return res.status(400).json({ message: "Post not created" });
    }
    res.status(201).json({ message: "Post created", comment });
  },

  // Récupérer tous les commentaires pour un restaurant
  getAllComments: async (req, res) => {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: {
        restaurant_id: parseInt(id),
      },
    });
    if (!comments) {
      return res.status(400).json({ message: "No comments found" });
    }
    res.status(200).json(comments);
  },

  // Mettre à jour un commentaire
  updateComment: async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const comment = await prisma.comment.update({
      where: {
        id: parseInt(id),
      },
      data: {
        content: content,
      },
    });
    if (!comment) {
      return res.status(400).json({ message: "Comment not updated" });
    }
    res.status(200).json({ message: "Comment updated", comment });
  },

  // Supprimer un commentaire
  deleteComment: async (req, res) => {
    const { id } = req.params;
    const comment = await prisma.comment.delete({
      where: {
        id: parseInt(id),
      },
    });
    if (!comment) {
      return res.status(400).json({ message: "Comment not deleted" });
    }
    res.status(200).json({ message: "Comment deleted", comment });
  },
};
