// User controller with prisma and mysql
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  // Récupérer tous les utilisateurs
  getAllUsers: async (req, res) => {
    const users = await prisma.user.findMany();
    if (!users) {
      return res.status(400).json({ message: "No users found" });
    }
    res.status(200).json(users);
  },
  // Récupérer un utilisateur par ID
  getOneUser: async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }
    res.status(200).json(user);
  },
  // Créer un nouvel utilisateur
  createUser: async (req, res) => {
    const { username, email, password } = req.body;
    const user = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: password,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User not created" });
    }
    res.status(201).json({ message: "User created", user });
  },
  // Mettre à jour un utilisateur
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { username, email, password } = req.body;
    const user = await prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: {
        username: username,
        email: email,
        password: password,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User not updated" });
    }
    res.status(200).json({ message: "User updated", user });
  },
  // Supprimer un utilisateur
  deleteUser: async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.delete({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User not deleted" });
    }
    res.status(200).json({ message: "User deleted", user });
  },
  // Récupérer tous les posts d'un utilisateur
  getAllPostsFromUser: async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        posts: true,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }
    res.status(200).json(user.posts);
  },
};
