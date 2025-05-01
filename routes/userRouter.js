const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { generateToken, generateRefreshToken, generateNewJWTSecret } = require('../utils/jwt');
const fs = require('fs');
const path = require('path');

// Utility function to handle errors
const handleError = (res, status, message) => {
  return res.status(status).json({ error: message });
};

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password_hash: 0 }); // Exclude password_hash
    res.json(users);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Get a single user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password_hash: 0 }); // Exclude password_hash
    if (!user) {
      return handleError(res, 404, 'User not found');
    }
    res.json(user);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Update a user by ID
router.put('/users/:id', async (req, res) => {
  try {
    const { full_name, email, phone_number, status, user_image } = req.body;

    // Check if the user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return handleError(res, 404, 'User not found');
    }

    // Update user fields
    if (full_name) user.full_name = full_name;
    if (email) user.email = email.trim(); // Trim email
    if (phone_number) user.phone_number = phone_number;
    if (status) user.status = status;
    if (user_image) user.user_image = user_image; // Update user image

    // Save the updated user
    const updatedUser = await user.save();

    // Return the updated user (excluding the password hash)
    const userResponse = { ...updatedUser.toObject() };
    delete userResponse.password_hash;

    res.json(userResponse);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Delete a user by ID
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return handleError(res, 404, 'User not found');
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Register a new user via form (without email verification)
router.post('/form-reg', async (req, res) => {
  try {
    const { full_name, email, password, phone_number, user_image } = req.body;

    // Validate required fields
    if (!full_name || !email || !password) {
      return handleError(res, 400, 'Full name, email, and password are required');
    }

    // Trim inputs
    const trimmedEmail = email.trim();

    // Check if the email already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return handleError(res, 400, 'Email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      full_name,
      email: trimmedEmail,
      password_hash,
      phone_number: phone_number || null,
      user_image: user_image || null,
      status: 'active',
      user_role: 'employee',
      isVerified: true,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Return the user (excluding the password hash)
    const userResponse = savedUser.toObject();
    delete userResponse.password_hash;

    res.status(201).json(userResponse);
  } catch (err) {
    console.error('Form registration error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Login a user
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('Missing credentials:', { email: !!email, password: !!password });
      return handleError(res, 400, 'Email and password are required');
    }

    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Find the user by email
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.log('User not found:', trimmedEmail);
      return handleError(res, 400, 'Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.log('Inactive user:', { email: trimmedEmail, status: user.status });
      return handleError(res, 403, 'Account is not active');
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password_hash);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', trimmedEmail);
      return handleError(res, 400, 'Invalid email or password');
    }

    // Generate new JWT secret
    const newJWTSecret = generateNewJWTSecret();
    
    // Update .env file with new JWT secret
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      console.log('Creating new .env file');
    }

    // Update or add JWT_SECRET
    if (envContent.includes('JWT_SECRET=')) {
      envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${newJWTSecret}`);
    } else {
      envContent += `\nJWT_SECRET=${newJWTSecret}`;
    }

    // Write back to .env file
    fs.writeFileSync(envPath, envContent);

    // Update process.env
    process.env.JWT_SECRET = newJWTSecret;

    // Generate tokens with new secret
    try {
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Update user's refresh token in database
      user.refreshToken = refreshToken;
      await user.save();

      // Return the user data and tokens
      const userResponse = { ...user.toObject() };
      delete userResponse.password_hash;
      delete userResponse.refreshToken;
      
      console.log('Login successful:', { email: trimmedEmail, userId: user._id });
      
      res.json({
        user: userResponse,
        accessToken,
        refreshToken
      });
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return handleError(res, 500, 'Error generating authentication tokens');
    }
  } catch (err) {
    console.error('Login error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Add a refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return handleError(res, 400, 'Refresh token is required');
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Find the user
    const user = await User.findOne({ 
      _id: decoded.userId,
      refreshToken: refreshToken
    });

    if (!user) {
      return handleError(res, 401, 'Invalid refresh token');
    }

    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update user's refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    handleError(res, 401, 'Invalid refresh token');
  }
});

module.exports = router;