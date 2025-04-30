
const express = require("express");
const router = express.Router();
const Commi = require("../models/Commi");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Set up storage for images
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST route to add community post
router.post("/add", upload.single("photo"), async (req, res) => {
  try {
    const { email, location, description } = req.body;

    // Validate required fields
    if (!email || !location || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newCommunity = new Commi({
      email,
      photo: filePath,
      location,
      description,
      likes: 0,
      comments: []
    });

    await newCommunity.save();
    res.status(201).json({ 
      message: "Post added successfully", 
      data: newCommunity 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error adding post", 
      details: err.message 
    });
  }
});

// GET all community posts
router.get("/getAll", async (req, res) => {
  try {
    const commis = await Commi.find().sort({ createdAt: -1 });
    res.json(commis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error fetching posts", 
      details: err.message 
    });
  }
});

// GET single post by ID
router.get("/get/:id", async (req, res) => {
  try {
    const post = await Commi.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error fetching post", 
      details: err.message 
    });
  }
});

// UPDATE a post
router.put("/update/:id", upload.single("photo"), async (req, res) => {
  try {
    const { email, description, location } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : req.body.photo;

    const updateData = { 
      email, 
      description, 
      location 
    };

    if (photo) updateData.photo = photo;

    const updatedPost = await Commi.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ 
      message: "Post updated successfully", 
      data: updatedPost 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error updating post", 
      details: err.message 
    });
  }
});

// DELETE a post
router.delete("/delete/:id", async (req, res) => {
  try {
    const post = await Commi.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Delete the associated photo file
    if (post.photo) {
      const filePath = path.join(__dirname, "..", post.photo);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Error deleting file:", err);
        }
      });
    }

    await Commi.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error deleting post", 
      details: err.message 
    });
  }
});

// ADD a comment to a post
router.post("/:id/comments", async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const updatedPost = await Commi.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { text } } },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];
    
    res.status(201).json({ 
      message: "Comment added successfully",
      comment: newComment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error adding comment", 
      details: err.message 
    });
  }
});

// LIKE a post
router.post("/:id/like", async (req, res) => {
  try {
    const updatedPost = await Commi.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ 
      message: "Post liked successfully",
      likes: updatedPost.likes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error liking post", 
      details: err.message 
    });
  }
});

// GET all comments for a post
router.get("/:id/comments", async (req, res) => {
  try {
    const post = await Commi.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    res.json(post.comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: "Error fetching comments", 
      details: err.message 
    });
  }
});

module.exports = router;
