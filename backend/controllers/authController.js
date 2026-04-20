const { User } = require('../models');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: '30d',
  });
};

const authController = {
  // REGISTER User
  register: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user (password hashing is handled by Sequelize hook)
      const user = await User.create({
        name,
        email,
        password,
        role,
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user.id),
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error registering user', error: error.message });
    }
  },

  // LOGIN User
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ where: { email } });

      if (user && (await user.comparePassword(password))) {
        res.status(200).json({
          message: 'Login successful',
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
          },
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  },
};

module.exports = authController;
