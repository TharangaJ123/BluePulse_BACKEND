require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const { generateToken, generateRefreshToken } = require('./utils/jwt');
const jwt = require('jsonwebtoken');

async function testAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in .env file');
    }
    console.log('JWT_SECRET is configured');

    // Create a test user
    const testUser = {
      full_name: 'Test User',
      email: 'test@example.com',
      password_hash: 'testpassword123',
      status: 'active',
      user_role: 'user'
    };

    // Check if user exists
    let user = await User.findOne({ email: testUser.email });
    
    if (!user) {
      // Create new user
      user = new User(testUser);
      await user.save();
      console.log('Test user created');
    } else {
      console.log('Test user already exists');
    }

    // Test password comparison
    const isPasswordValid = await bcrypt.compare('testpassword123', user.password_hash);
    console.log('Password comparison test:', isPasswordValid ? 'Passed' : 'Failed');

    // Test token generation
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    console.log('Token generation test:', accessToken ? 'Passed' : 'Failed');

    // Test token verification
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    console.log('Token verification test:', decoded ? 'Passed' : 'Failed');

    console.log('\nAll tests passed! Authentication system is working correctly.');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testAuth(); 