const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const bcrypt = require('bcrypt'); // For password hashing
const nodemailer = require('nodemailer'); // For sending emails
const crypto = require('crypto'); // For generating verification tokens

// Utility function to handle errors
const handleError = (res, status, message) => {
  return res.status(status).json({ error: message });
};

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail or another email service
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password
  },
});

// Register a new user via email (with verification) - Existing method
router.post('/reg', async (req, res) => {
  try {
    const { full_name, email, password, phone_number } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return handleError(res, 400, 'Email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate a verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create a new user
    const newUser = new User({
      full_name,
      email,
      password_hash,
      phone_number: phone_number || null,
      status: 'active', // Default status
      user_role: 'employee', // Default role
      verificationToken, // Add verification token
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Send verification email
    const verificationUrl = `http://localhost:5000/User/verify-email?token=${verificationToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      text: `Please click the following link to verify your email: ${verificationUrl}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return handleError(res, 500, 'Error sending verification email');
      }
      console.log('Verification email sent:', info.response);
    });

    // Return the user (excluding the password hash)
    const userResponse = savedUser.toObject ? savedUser.toObject() : savedUser;
    delete userResponse.password_hash;

    res.status(201).json(userResponse);
  } catch (err) {
    console.error('Registration error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Register a new user via form (without email verification) - New method
router.post('/form-reg', async (req, res) => {
  try {
    const { full_name, email, password, phone_number } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return handleError(res, 400, 'Email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      full_name,
      email,
      password_hash,
      phone_number: phone_number || null,
      status: 'active', // Default status
      user_role: 'employee', // Default role
      isVerified: true, // Mark as verified since no email verification is needed
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Return the user (excluding the password hash)
    const userResponse = savedUser.toObject ? savedUser.toObject() : savedUser;
    delete userResponse.password_hash;

    res.status(201).json(userResponse);
  } catch (err) {
    console.error('Form registration error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Verify email endpoint - Existing method
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return handleError(res, 400, 'Invalid or expired token');
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined; // Clear the token
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Email verification error:', err);
    handleError(res, 500, 'Server error');
  }
});

// Get all users - Existing method
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password_hash: 0 }); // Exclude password_hash
    res.json(users);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Get a single user by ID - Existing method
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

// Update a user by ID - Existing method
router.put('/users/:id', async (req, res) => {
  try {
    const { full_name, email, phone_number, status } = req.body;

    // Check if the user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return handleError(res, 404, 'User not found');
    }

    // Update user fields
    if (full_name) user.full_name = full_name;
    if (email) user.email = email;
    if (phone_number) user.phone_number = phone_number;
    if (status) user.status = status;

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

// Delete a user by ID - Existing method
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

// Login a user - Existing method
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return handleError(res, 400, 'Invalid email or password');
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return handleError(res, 400, 'Invalid email or password');
    }

    // Check if the user's email is verified (only for email-based registration)
    if (user.verificationToken && !user.isVerified) {
      return handleError(res, 400, 'Please verify your email before logging in');
    }

    // Return the user (excluding the password hash)
    const userResponse = { ...user.toObject() };
    delete userResponse.password_hash;

    res.json(userResponse);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

module.exports = router;