const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session'); // Add express-session
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userRouter = require('./routes/userRouter');
const employeeRouter = require('./routes/employeeRouter');
const RoleAccess = require('./routes/roleAccess');
const User = require('./models/User'); // Import the User model

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS

// Configure express-session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // Session expiration time (e.g., 1 day)
    },
  })
);

// Initialize Passport and restore authentication state from the session
app.use(passport.initialize());
app.use(passport.session()); // Enable session support for Passport

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Passport Google OAuth2.0 Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            full_name: profile.displayName,
            email: profile.emails[0].value,
            isVerified: true,
            user_role: 'employee', // Default role
          });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Serialize and Deserialize User
passport.serializeUser((user, done) => {
  done(null, user.id); // Store user ID in the session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Retrieve user from the session
  } catch (err) {
    done(err, null);
  }
});

// Routes
app.get('/', (req, res) => {
  res.send('Hello from the MERN backend!');
});

// Google Authentication Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect or respond with token
    res.redirect('/');
  }
);

// Use the user router for all user-related routes
app.use('/User', userRouter);
app.use('/Employee', employeeRouter);
app.use('/RoleAccess', RoleAccess);

// Start the server
const PORT = process.env.PORT || 8070;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});