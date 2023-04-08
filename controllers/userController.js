const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

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

  // Création de l'utilisateur
  createUser: async (req, res) => {
    const { username, email, password } = req.body;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters, one uppercase, one lowercase and one number",
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          username: username,
          email: email,
          password: hashedPassword,
        },
      });
      if (!newUser) {
        return res.status(400).json({ message: "User not created" });
      }
      res.status(201).json({ message: "User created", newUser });
    } else {
      res.status(400).json({ message: "User already exists" });
    }
  },

  // Connexion de l'utilisateur
  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      res.status(200).json({ message: "User logged in", user });
    } else {
      res.status(400).json({ message: "User not found" });
    }
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
