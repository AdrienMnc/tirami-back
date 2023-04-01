const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Récupérer tous les restaurants favoris d'un utilisateur
  getAllMyFavoriteRestaurants: async (req, res) => {
    const { id } = req.params;
    const myFavoriteRestaurants = await prisma.myFavoriteRestaurant.findMany({
      where: {
        user_id: parseInt(id),
      },
    });
    if (!myFavoriteRestaurants) {
      return res.status(400).json({ message: "No favorite restaurant found" });
    }
    res.status(200).json(myFavoriteRestaurants);
  },

  // Ajouter un restaurant aux favoris d'un utilisateur
  addMyFavoriteRestaurant: async (req, res) => {
    const { user_id, restaurant_id } = req.body;
    const myFavoriteRestaurant = await prisma.myFavoriteRestaurant.create({
      data: {
        user_id: user_id,
        restaurant_id: restaurant_id,
      },
    });
    if (!myFavoriteRestaurant) {
      return res.status(400).json({ message: "Restaurant not added" });
    }
    res.status(201).json({ message: "Restaurant added", myFavoriteRestaurant });
  },

  // Supprimer un restaurant des favoris d'un utilisateur
  deleteMyFavoriteRestaurant: async (req, res) => {
    const { id } = req.params;
    const myFavoriteRestaurant = await prisma.myFavoriteRestaurant.delete({
      where: {
        id: parseInt(id),
      },
    });
    if (!myFavoriteRestaurant) {
      return res.status(400).json({ message: "Restaurant not deleted" });
    }
    res
      .status(200)
      .json({ message: "Restaurant deleted", myFavoriteRestaurant });
  },
};
