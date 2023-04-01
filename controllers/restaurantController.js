// User controller with prisma and mysql
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Récupérer un restaurant par ID
  getOneRestaurant: async (req, res) => {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!restaurant) {
      return res.status(400).json({ message: "No restaurant found" });
    }
    res.status(200).json(restaurant);
  },

  // Récupérer tous les commentaires pour un restaurant
  getAllComments: async (req, res) => {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: {
        restaurantId: parseInt(id),
      },
    });
    if (!comments) {
      return res.status(400).json({ message: "No comments found" });
    }
    res.status(200).json(comments);
  },
};
