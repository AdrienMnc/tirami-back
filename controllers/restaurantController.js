const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  /*
   * Récupérer un restaurant par l'ID de référence dans notre base de données (utilité à vérifier)
   * => les posts sont inclus avec les photos
   */
  getOneRestaurantFromInternalID: async (req, res) => {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        posts: {
          include: {
            post_pics: true,
            author: {
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
          },
        },
        post_pics: true,
      },
    });
    if (!restaurant) {
      return res.status(400).json({ message: "No restaurant found" });
    }
    res.status(200).json(restaurant);
  },

  /*
   * Récupérer un restaurant par l'ID sous lequel il est enregistré dans l'API externe (utilisé lors des recherches de restaurants)
   * => les posts sont inclus avec les photos
   */
  getOneRestaurantFromApiID: async (req, res) => {
    const { id_api } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id_api: id_api,
      },
      include: {
        posts: {
          include: {
            post_pics: true,
            author: {
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
          },
        },
        post_pics: true,
      },
    });
    if (!restaurant) {
      return res.status(400).json({ message: "No restaurant found" });
    }
    // Vérifier que le nom du restaurant dans la base de données correspond au nom du restaurant dans l'API externe
    if (restaurant.name !== restaurant.name_api) {
      const updatedRestaurant = await prisma.restaurant.update({
        where: {
          id_api: id_api,
        },
        data: {
          name: restaurant.name_api,
        },
      });
      res.status(200).json(updatedRestaurant);
    } else {
      res.status(200).json(restaurant);
    }
  },

  /*
   * Enregistrer un nouveau restaurant ----------------------------- à compléter après avoir gérer l'API restaurants
   */
  createRestaurant: async (req, res) => {
    const { id_api } = req.body;
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id_api: id_api,
      },
    });
    if (restaurant) {
      return res.status(400).json({ message: "Restaurant already exists" });
    }
    const newRestaurant = await prisma.restaurant.create({
      data: {
        ...req.body,
      },
    });
    res.status(201).json(newRestaurant);
  },
};
