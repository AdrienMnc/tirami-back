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
};
