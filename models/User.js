const mongoose = require('mongoose'); // Import mongoose
const { v4: uuidv4 } = require('uuid'); // Import uuid for custom ID generation
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    maxlength: 255,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 255,
  },
  password_hash: {
    type: String,
    required: function () {
      return !this.googleId; // Only required for non-Google users
    },
  },
  phone_number: {
    type: String,
    maxlength: 20,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active',
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness for non-null values
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  // New fields for additional features
  refreshToken: {
    type: String,
    default: null, // Stores the refresh token for JWT
  },
  passwordResetToken: {
    type: String,
    default: null, // Stores the password reset token
  },
  passwordResetExpires: {
    type: Date,
    default: null, // Stores the expiration time for the password reset token
  },
  emailVerificationToken: {
    type: String,
    default: null, // Stores the email verification token
  },
  emailVerified: {
    type: Boolean,
    default: false, // Tracks whether the email is verified
  },
  user_image: {
    type: String,
    default: null, // Stores the URL or path to the user's image
  },
  user_role: {
    type: String,
    enum: ['admin', 'employee', 'user'],
    default: 'user',
  },
}, {
  timestamps: false,
});

// Middleware to update `updated_at` before saving
userSchema.pre('save', function (next) {
  this.updated_at = Date.now(); // Update the `updated_at` field to the current timestamp
  next();
});

// Middleware to hash the password before saving the user
userSchema.pre('save', async function (next) {
  try {
    if (this.isModified('password_hash')) {
      console.log('Hashing password...');
      const salt = await bcrypt.genSalt(10);
      this.password_hash = await bcrypt.hash(this.password_hash, salt);
      console.log('Password hashed successfully');
    }
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare passwords (for login)
userSchema.methods.comparePassword = async function (password) {
  try {
    console.log('Comparing passwords...');
    console.log('Input password:', password);
    console.log('Stored hash:', this.password_hash);
    const result = await bcrypt.compare(password, this.password_hash);
    console.log('Password comparison result:', result);
    return result;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};

// Method to generate a password reset token
userSchema.methods.generatePasswordResetToken = function () {
  this.passwordResetToken = uuidv4(); // Generate a unique token
  this.passwordResetExpires = Date.now() + 3600000; // Token expires in 1 hour
  return this.passwordResetToken;
};

// Method to generate an email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  this.emailVerificationToken = uuidv4(); // Generate a unique token
  return this.emailVerificationToken;
};

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User; // Export the User model