const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Récupérer le nom de tous les desserts
  getAllDesserts: async (req, res) => {
    const desserts = await prisma.dessert.findMany();
    if (!desserts) {
      return res.status(400).json({ message: "No dessert found" });
    }
    res.status(200).json(desserts);
  },
  // Récupérer tous les types de desserts
  getAllDessertTypes: async (req, res) => {
    try {
      const desserts = await prisma.dessert.findMany();
      const dessertTypes = desserts.map((dessert) => dessert.type);
      res.status(200).json(dessertTypes);
    } catch (error) {
      res.status(500).json({
        error:
          "Une erreur est survenue lors de la récupération des types de desserts.",
      });
    }
  },

  // Récupérer tous les desserts d'un type donné
  getAllDessertsFromType: async (req, res) => {
    const { type } = req.params;
    const desserts = await prisma.dessert.findMany({
      where: {
        type: type,
      },
    });
    if (!desserts) {
      return res.status(400).json({ message: "No dessert found" });
    }
    res.status(200).json(desserts);
  },
};
