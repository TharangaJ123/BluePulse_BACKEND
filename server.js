const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const app =express();
<<<<<<< HEAD
const path = require("path");
const cron = require('node-cron');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const { checkLowStockAndNotify } = require('./utils/sedEmail.js'); // Import the function
const productRoutes = require('./routes/Products');
=======
const passport = require('passport');
const session = require('express-session'); // Add express-session
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userRouter = require('./routes/userRouter');
const employeeRouter = require('./routes/employeeRouter');
const RoleAccess = require('./routes/roleAccess');
const User = require('./models/User'); 
>>>>>>> main

require('dotenv').config();

const PORT = process.env.PORT || 8070;

const path = require('path');


// Serve static files from the 'public' folder
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.json());

const URL = process.env.MONGODB_URL;

mongoose.connect(URL,{

    useNewUrlParser:true,
    useUnifiedTopology:true,

});

const connection = mongoose.connection;

connection.once('open',()=>{
    console.log("MOngoDB connection is successfull");
});

const productRouter = require("./routes/Products.js");
app.use("/products", productRouter);

const supplierRouter = require("./routes/Suppliers.js");
app.use("/suppliers", supplierRouter);

// Schedule a cron job to run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Checking for low stock products...');

  const products = await Product.find().populate('supplier');
  for (const product of products) {
    if (product.quantity <= 10) { // Check if quantity is less than or equal to 10
      await checkLowStockAndNotify(product._id, product.quantity);
    }
  }
});

app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

app.listen(PORT,()=>{
    console.log(`Server is up and running on port number: ${PORT}`);
})

// Passport Google OAuth2.0 Strategy
passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'http://localhost:8070/auth/google/callback',
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
  
  