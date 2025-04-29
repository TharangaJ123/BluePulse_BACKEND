const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../utils/authMiddleware');
const Purchase = require('../models/Purchase');
const Upload = require('../models/Upload');
const CommunityPost = require('../models/CommunityPost');
const Feed = require('../models/Feed');

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
    console.log('Registration attempt for email:', email);

    // Validate required fields
    if (!full_name || !email || !password) {
      console.log('Missing required fields');
      return handleError(res, 400, 'Full name, email, and password are required');
    }

    // Validate password length
    if (password.length < 6) {
      console.log('Password too short');
      return handleError(res, 400, 'Password must be at least 6 characters long');
    }

    // Trim inputs
    const trimmedEmail = email.trim();

    // Check if the email already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      console.log('Email already exists:', trimmedEmail);
      return handleError(res, 400, 'Email already exists');
    }

    // Create a new user
    const newUser = new User({
      full_name,
      email: trimmedEmail,
      password_hash: password, // The pre-save middleware will hash this
      phone_number: phone_number || null,
      user_image: user_image || null,
      status: 'active',
      user_role: 'employee',
      isVerified: true,
    });

    console.log('Saving new user...');
    // Save the user to the database
    const savedUser = await newUser.save();
    console.log('User saved successfully:', savedUser._id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.user_role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return the user and token
    const userResponse = savedUser.toObject();
    delete userResponse.password_hash;

    res.status(201).json({
      user: userResponse,
      token
    });
  } catch (err) {
    console.error('Form registration error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Validate required fields
    if (!email || !password) {
      console.log('Missing email or password');
      return handleError(res, 400, 'Email and password are required');
    }

    // Validate password length
    if (password.length < 6) {
      console.log('Password too short');
      return handleError(res, 400, 'Password must be at least 6 characters long');
    }

    // Trim inputs
    const trimmedEmail = email.trim();

    // Find the user by email
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.log('User not found for email:', trimmedEmail);
      return handleError(res, 400, 'Invalid email or password');
    }

    console.log('User found with ID:', user._id);

    // Compare the password using the model's method
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', user._id);
      return handleError(res, 400, 'Invalid email or password');
    }

    // Generate JWT token
    const tokenPayload = { 
      id: user._id.toString(), // Convert ObjectId to string
      email: user.email,
      role: user.user_role 
    };
    console.log('Token payload:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('JWT token generated successfully');

    // Return the user, token, and redirect URL
    const userResponse = user.toObject();
    delete userResponse.password_hash;

    const response = {
      user: userResponse,
      token,
      redirectUrl: `/profile/${user._id.toString()}` // Ensure ID is string
    };
    console.log('Login response:', response);

    res.json(response);
  } catch (err) {
    console.error('Login error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Protected route - Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile request received');
    console.log('User from token:', req.user);
    
    // Find the user by ID from the token
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return handleError(res, 404, 'User not found');
    }

    console.log('User profile found:', user._id);
    res.json({
      user: user,
      message: 'Profile retrieved successfully'
    });
  } catch (err) {
    console.error('Profile error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Protected route - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Profile update request for user:', req.user.id);
    
    const { full_name, phone_number, user_image } = req.body;

    // Find the user by ID from the token
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return handleError(res, 404, 'User not found');
    }

    // Update user fields
    if (full_name) user.full_name = full_name;
    if (phone_number) user.phone_number = phone_number;
    if (user_image) user.user_image = user_image;

    // Save the updated user
    const updatedUser = await user.save();
    console.log('User profile updated:', updatedUser._id);

    // Return the updated user (excluding the password hash)
    const userResponse = updatedUser.toObject();
    delete userResponse.password_hash;

    res.json({
      user: userResponse,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Profile update error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Get user profile by ID
router.get('/profile/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Profile request received');
    console.log('Requested profile ID:', req.params.id);
    console.log('User ID from token:', req.user.id);
    
    // Convert both IDs to strings for comparison
    const requestedId = req.params.id.toString();
    const tokenId = req.user.id.toString();
    
    console.log('Comparing IDs:', {
      requestedId,
      tokenId,
      areEqual: requestedId === tokenId
    });

    // Check if the requested profile belongs to the authenticated user
    if (requestedId !== tokenId) {
      console.log('Unauthorized profile access attempt');
      return handleError(res, 403, 'Unauthorized access');
    }

    // Find the user by ID
    const user = await User.findById(requestedId).select('-password_hash');
    if (!user) {
      console.log('User not found for ID:', requestedId);
      return handleError(res, 404, 'User not found');
    }

    console.log('User profile found:', user._id);
    res.json({
      user: user,
      message: 'Profile retrieved successfully'
    });
  } catch (err) {
    console.error('Profile error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Get user data by email
router.get('/user-data/:email', authenticateToken, async (req, res) => {
  try {
    console.log('Getting user data for email:', req.params.email);
    
    // Find the user by email
    const user = await User.findOne({ email: req.params.email }).select('-password_hash');
    if (!user) {
      console.log('User not found for email:', req.params.email);
      return handleError(res, 404, 'User not found');
    }

    // Get user's online purchases
    const purchases = await Purchase.find({ user: user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    // Get user's uploaded content
    const uploads = await Upload.find({ user: user._id })
      .sort({ createdAt: -1 });

    // Get user's community posts
    const communityPosts = await CommunityPost.find({ user: user._id })
      .populate('comments')
      .sort({ createdAt: -1 });

    // Get user's feeds
    const feeds = await Feed.find({ user: user._id })
      .sort({ createdAt: -1 });

    console.log('User data retrieved successfully');
    res.json({
      user: user,
      purchases: purchases,
      uploads: uploads,
      communityPosts: communityPosts,
      feeds: feeds
    });
  } catch (err) {
    console.error('Error getting user data:', err);
    handleError(res, 500, 'Server error');
  }
});

// Get user's online purchases
router.get('/purchases/:email', authenticateToken, async (req, res) => {
  try {
    console.log('Getting purchases for email:', req.params.email);
    
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return handleError(res, 404, 'User not found');
    }

    const purchases = await Purchase.find({ user: user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (err) {
    console.error('Error getting purchases:', err);
    handleError(res, 500, 'Server error');
  }
});

// Get user's uploads
router.get('/uploads/:email', authenticateToken, async (req, res) => {
  try {
    console.log('Getting uploads for email:', req.params.email);
    
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return handleError(res, 404, 'User not found');
    }

    const uploads = await Upload.find({ user: user._id })
      .sort({ createdAt: -1 });

    res.json(uploads);
  } catch (err) {
    console.error('Error getting uploads:', err);
    handleError(res, 500, 'Server error');
  }
});

// Get user's community posts
router.get('/community/:email', authenticateToken, async (req, res) => {
  try {
    console.log('Getting community posts for email:', req.params.email);
    
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return handleError(res, 404, 'User not found');
    }

    const communityPosts = await CommunityPost.find({ user: user._id })
      .populate('comments')
      .sort({ createdAt: -1 });

    res.json(communityPosts);
  } catch (err) {
    console.error('Error getting community posts:', err);
    handleError(res, 500, 'Server error');
  }
});

// Get user's feeds
router.get('/feeds/:email', authenticateToken, async (req, res) => {
  try {
    console.log('Getting feeds for email:', req.params.email);
    
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return handleError(res, 404, 'User not found');
    }

    const feeds = await Feed.find({ user: user._id })
      .sort({ createdAt: -1 });

    res.json(feeds);
  } catch (err) {
    console.error('Error getting feeds:', err);
    handleError(res, 500, 'Server error');
  }
});

module.exports = router;