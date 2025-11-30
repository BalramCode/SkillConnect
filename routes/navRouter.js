// mainRouter.js
const express = require("express");
const router = express.Router();
const userModel = require("../model/userModel");
const groupModel = require("../model/groupModel");
const projectModel = require("../model/projectModel");
const isLoggedIn = require("../middleware/isLoggedIn");

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// Use the middleware to protect and populate req.user
router.get("/dashboard", isLoggedIn, async (req, res) => {
  // Now req.user holds the logged-in user's data!
  res.render("dashboard", { user: req.user });
});

router.get("/projects", isLoggedIn, async (req, res) => {
  try {
    const projects = await projectModel
      .find()
      .populate("creator")
      .populate("members")
      .populate("joinRequests.user")
      .sort({ createdAt: -1 });

    const message = req.query.msg || null; // <-- ADD THIS

    res.render("projects", {
      projects,
      user: req.user,
      message, // <-- SEND TO EJS
    });
  } catch (err) {
    console.log(err);
    res.send("Error loading projects");
  }
});

router.get("/groups", isLoggedIn, async (req, res) => {
  const groups = await groupModel.find().sort({ createdAt: -1 });
  res.render("groups", { groups, user: req.user });
});

// Apply middleware to other protected routes
router.get("/chat", isLoggedIn, (req, res) => {
  res.render("Chat", { user: req.user });
});
router.get("/setting", isLoggedIn, (req, res) => {
  res.render("Setting", { user: req.user });
});

//For LoggedIn User 
router.get("/profile", isLoggedIn, async (req, res) => {
  const isLoggedInUser = req.user;

  return res.render("Profile", { 
    user: isLoggedInUser,
    isLoggedIn: isLoggedInUser
  });
});



// For Other User
router.get("/profile/:username", isLoggedIn, async (req, res) => {
  try {
    const otherUser = await userModel.findOne({ username: req.params.username });

    if (!otherUser) return res.status(404).send("User not found");

    res.render("Profile", {
      user: otherUser,
      isLoggedIn: req.user || null
    });

  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).send("Server error");
  }
});






router.get("/project/:id", isLoggedIn, async (req, res) => {
  const project = await projectModel.findById(req.params.id)
    .populate("creator")
    .populate("members")
    .populate("joinRequests.user");

  res.render("specificProject", { 
    project, 
    user: req.user, 
    isLoggedIn: req.user  // ✅ ADD THIS
  });
});


module.exports = router;
