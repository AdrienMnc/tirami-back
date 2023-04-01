const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Suivre un utilisateur : créer une entrée dans la table follow (fait le lien entre deux utilisateurs)
  createFollow: async (req, res) => {
    const { follower_id, followed_id } = req.body;
    const follow = await prisma.follow.create({
      data: {
        follower_id: follower_id,
        followed_id: followed_id,
      },
    });
    if (!follow) {
      return res.status(400).json({ message: "Follow not created" });
    }
    res.status(201).json({ message: "Follow created", follow });
  },

  // Récupérer tous les utilisateurs suivis par un utilisateur
  getAllFollowed: async (req, res) => {
    const { id } = req.params;
    const followed = await prisma.follow.findMany({
      where: {
        follower_id: parseInt(id),
      },
    });
    if (!followed) {
      return res.status(400).json({ message: "No followed found" });
    }
    res.status(200).json(followed);
  },

  // Ne plus suivre un utilisateur : supprimer l'entrée dans la table follow
  deleteFollow: async (req, res) => {
    const { id } = req.params;
    const follow = await prisma.follow.delete({
      where: {
        id: parseInt(id),
      },
    });
    if (!follow) {
      return res.status(400).json({ message: "Follow not deleted" });
    }
    res.status(200).json({ message: "Follow deleted", follow });
  },
};
