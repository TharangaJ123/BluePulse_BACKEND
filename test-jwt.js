require('dotenv').config();
const jwt = require('jsonwebtoken');

// Test user data
const testUser = {
  _id: '123456789',
  email: 'test@example.com',
  user_role: 'user'
};

// Test JWT generation
try {
  // Generate token
  const token = jwt.sign(
    {
      userId: testUser._id,
      email: testUser.email,
      role: testUser.user_role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  console.log('Generated Token:', token);

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Decoded Token:', decoded);

  console.log('JWT setup is working correctly!');
} catch (error) {
  console.error('JWT Error:', error.message);
} 