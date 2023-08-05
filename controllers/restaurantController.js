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
        post: {
          include: {
            picture: {
              select: {
                url: true,
              },
            },
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
        post: {
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
      },
    });
    if (!restaurant) {
      return res.status(400).json({ message: "No restaurant found" });
    }
    // renvoyer le restaurant avec les posts liés
    res.status(200).json(restaurant);

    // // Vérifier que description_api dans la base de données correspond desription_api dans l'API externe
    // if (restaurant.description_api !== restaurant.description_api) {
    //   // Envoyer un message d'erreur
    //   res.status(400).json({ message: "Description doesn't match" });
    // } else {
    // renvoyer le restaurant avec les posts liés
    // res.status(200).json(restaurant);
    // }
  },

  /*
   * Enregistrer un nouveau restaurant ----------------------------- à compléter après avoir gérer l'API restaurants
   */
  createRestaurant: async (req, res) => {
    const { id_api, description_api, name_api } = req.body;
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
