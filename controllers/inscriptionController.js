// Inscription controller with prisma and mysql
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const inscriptionController = async (req, res) => {
  // Get the data from the request
  const { email, password } = req.body;

  // Create a new user in the database
  const user = await prisma.user.create({
    data: {
      email,
      password,
    },
  });

  // Send the user back to the client
  if (!user) {
    return res.status(400).json({ message: "User not created" });
  }
  res.status(201).json({ message: "User created", user });
};

// Export the controller
module.exports = {
  inscriptionController,
};
