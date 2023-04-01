const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Enregistrer une nouvelle photo dans la base de données (url, owner_id, profile_pic, post_id)
  createPicture: async (req, res) => {
    const { url, owner_id, profile_pic, post_id } = req.body;
    const picture = await prisma.picture.create({
      data: {
        url: url,
        owner_id: owner_id,
        profile_pic: profile_pic,
        post_id: post_id,
      },
    });
    if (!picture) {
      return res.status(400).json({ message: "Picture not registered" });
    }
    res.status(201).json({ message: "Picture registered", picture });
  },

  // Récupérer les photos liées à un post
  getPicturesByPost: async (req, res) => {
    const { id } = req.params;
    const pictures = await prisma.picture.findMany({
      where: {
        post_id: parseInt(id),
      },
    });
    if (!pictures) {
      return res.status(400).json({ message: "No pictures found" });
    }
    res.status(200).json(pictures);
  },

  // Récupérer la photo de profil d'un utilisateur
  getProfilePicture: async (req, res) => {
    const { id } = req.params;
    const picture = await prisma.picture.findUnique({
      where: {
        owner_id: parseInt(id),
        profile_pic: true,
      },
    });
    if (!picture) {
      return res.status(400).json({ message: "No profile picture found" });
    }
    res.status(200).json(picture);
  },
};
