require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is not defined in .env file.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Atlas Connected");
    console.log(`✅ Using Database: ${mongoose.connection.name}`); // Logs the database name
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

const serviceRoutes = require("./routes/services");
app.use("/api", serviceRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
