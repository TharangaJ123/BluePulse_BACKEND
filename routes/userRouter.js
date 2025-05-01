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
    const { full_name, email, password, phone_number, user_role } = req.body;

    // Validate required fields
    if (!full_name || !email || !password) {
      return handleError(res, 400, 'Full name, email, and password are required');
    }

    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Check if the email already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return handleError(res, 400, 'Email already exists');
    }

    // Create a new user with password stored directly
    const newUser = new User({
      full_name,
      email: trimmedEmail,
      password_hash: trimmedPassword, // Store password directly
      phone_number: phone_number || null,
      status: 'active',
      user_role: user_role || 'user',
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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return handleError(res, 400, 'Email and password are required');
    }

    // Trim inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    console.log('Login attempt for email:', trimmedEmail);
    console.log('Entered password:', trimmedPassword);

    // Find the user by email
    const user = await User.findOne({ email: trimmedEmail });
    
    if (!user) {
      console.log('User not found for email:', trimmedEmail);
      return handleError(res, 400, 'Invalid email or password');
    }

    console.log('User found:', {
      email: user.email,
      hasPassword: !!user.password_hash,
      status: user.status,
      storedPassword: user.password_hash // Now showing plain password
    });

    // Debug logging for password comparison
    console.log('Password comparison details:', {
      enteredPassword: trimmedPassword,
      storedPassword: user.password_hash,
      passwordLengths: {
        entered: trimmedPassword.length,
        stored: user.password_hash.length
      },
      passwordTypes: {
        entered: typeof trimmedPassword,
        stored: typeof user.password_hash
      }
    });

    // Direct string comparison without hashing
    const isPasswordValid = trimmedPassword == user.password_hash;
    console.log('Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', user.email);
      return handleError(res, 400, 'Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.log('User account not active:', user.email);
      return handleError(res, 400, 'Account is not active. Please contact support.');
    }

    // Generate tokens with existing secret
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update user's refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    // Return the user data and tokens
    const userResponse = user.toObject();
    delete userResponse.password_hash;
    delete userResponse.refreshToken;
    
    console.log('Login successful for user:', user.email);
    res.json({
      user: userResponse,
      accessToken,
      refreshToken
    });

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

// Get current user details
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash -refreshToken');
    if (!user) {
      return handleError(res, 404, 'User not found');
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user details:', err);
    handleError(res, 500, 'Server error');
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, phone_number } = req.body;

    // Validate required fields
    if (!email || !phone_number) {
      return handleError(res, 400, 'Email and phone number are required');
    }

    // Find the user by email
    const user = await User.findOne({ email: email.trim() });
    
    if (!user) {
      return handleError(res, 400, 'No account found with this email');
    }

    // Verify phone number
    if (user.phone_number !== phone_number.trim()) {
      return handleError(res, 400, 'Phone number does not match our records');
    }

    // Generate a temporary password reset token
    const resetToken = jwt.sign(
      { userId: user._id.toString() }, // Convert ObjectId to string
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Store the token in the user document
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    console.log('Reset token generated and stored:', {
      userId: user._id,
      resetToken: resetToken
    });

    res.json({ 
      message: 'Verification successful. You can now reset your password.',
      resetToken 
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return handleError(res, 400, 'Reset token and new password are required');
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return handleError(res, 400, 'Reset token has expired');
      }
      return handleError(res, 400, 'Invalid reset token');
    }
    
    if (!decoded || !decoded.userId) {
      return handleError(res, 400, 'Invalid reset token');
    }

    // Find the user by ID from the decoded token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return handleError(res, 400, 'User not found');
    }

    // Check if the stored reset token matches and is not expired
    if (!user.passwordResetToken) {
      return handleError(res, 400, 'No reset token found for this user');
    }

    if (user.passwordResetToken !== resetToken) {
      return handleError(res, 400, 'Invalid reset token');
    }

    if (user.passwordResetExpires < Date.now()) {
      return handleError(res, 400, 'Reset token has expired');
    }

    // Store new password directly without hashing
    user.password_hash = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    console.log('Password reset successful for user:', user.email);
    res.json({ message: 'Password has been reset successfully' });

  } catch (err) {
    console.error('Reset password error:', err);
    handleError(res, 500, 'Server error');
  }
});

module.exports = router;