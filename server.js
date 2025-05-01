const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const app =express();
const path = require("path");
const cron = require('node-cron');
const passport = require('passport');
const session = require('express-session'); // Add express-session
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userRouter = require('./routes/userRouter');
const employeeRouter = require('./routes/employeeRouter');
const RoleAccess = require('./routes/roleAccess');
const User = require('./models/User');
const ContactRouter=require('./routes/contactRouter.js')
const contact=require('./models/Contact .js')

require('dotenv').config();

const PORT = process.env.PORT || 8070;

app.use(cors());
app.use(express.json());

const URL = process.env.MONGODB_URL;

mongoose.connect(URL,{

    useNewUrlParser:true,
    useUnifiedTopology:true,

});

const connection = mongoose.connection;

const productRouter = require("./routes/Products.js");
app.use("/products", productRouter);

const supplierRouter = require("./routes/Suppliers.js");
app.use("/suppliers", supplierRouter);

const orderRouter = require("./routes/OrderRoutes.js");
app.use("/orders",orderRouter)

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


//bhagya

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
      // Generate tokens for the authenticated user
      const accessToken = generateAccessToken(req.user);
      const refreshToken = generateRefreshToken(req.user);

      // Update user's refresh token in database
      req.user.refreshToken = refreshToken;
      req.user.save();

      // Return the user data and tokens
      const userResponse = req.user.toObject();
      delete userResponse.password_hash;
      delete userResponse.refreshToken;

      // Send the response back to the popup window
      res.send(`
        <script>
          window.opener.postMessage({
            user: ${JSON.stringify(userResponse)},
            accessToken: "${accessToken}",
            refreshToken: "${refreshToken}"
          }, 'http://localhost:3000');
          window.close();
        </script>
      `);
    }
  );
  
  // Use the user router for all user-related routes
  app.use('/User', userRouter);
  app.use('/Employee', employeeRouter);
  app.use('/RoleAccess', RoleAccess);
  app.use('/Contact',ContactRouter);


  //sashika
  const FinanceRouter = require("./routes/Finances.js");
  app.use("/Finance",FinanceRouter);


//lahiru
const feedbackRouter =require("./routes/feedbacks.js");
app.use("/feedback",feedbackRouter);

const commiRouter =require("./routes/commis.js");
app.use("/commi",commiRouter);

//lathika
const serviceRoutes = require("./routes/services");
const Contact = require('./models/Contact .js');
app.use("/api", serviceRoutes);

connection.once('open',()=>{
    console.log("MOngoDB connection is successfull");
});

app.listen(PORT,()=>{
    console.log(`Server is up and running on port number: ${PORT}`);
})