const { User, sequelize } = require('./models');

async function createLavioUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: 'lavio@example.com' } });
    if (existingUser) {
      console.log('User lavio already exists!');
      return;
    }

    // Create new user
    const user = await User.create({
      name: 'Lavio',
      email: 'lavio@example.com',
      password: 'password123', // This will be hashed by the hook
      role: 'admin',
      is_active: true,
    });

    console.log('User lavio created successfully!');
    console.log('User details:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await sequelize.close();
  }
}

createLavioUser();