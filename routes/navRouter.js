// mainRouter.js
const express = require("express");
const router = express.Router();
const userModel = require("../model/userModel");
const groupModel = require("../model/groupModel");
const projectModel = require("../model/projectModel");
const isLoggedIn = require("../middleware/isLoggedIn");
const Task = require("../model/taskModel");

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

router.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Fetch Projects (Active, Owned, and Sent Requests)
    const activeProjects = await projectModel.find({
      members: userId,
    }).populate("creator");

    const creatorProjects = await projectModel.find({
      creator: userId
    }).populate("joinRequests.user");

    const userJoinRequests = await projectModel.find({
      "joinRequests.user": userId
    });

    // 2️⃣ Calculate Unique Team Members
    const teamMemberSet = new Set();
    activeProjects.forEach(p => {
      p.members.forEach(m => teamMemberSet.add(m.toString()));
    });

    // 3️⃣ Fetch Task Statistics (Assuming 'Task' model is imported)
    // Using Promise.all is faster as it runs queries in parallel
    const [completedTasks, pendingTasks] = await Promise.all([
      Task.countDocuments({ assignedTo: userId, status: "done" }),
      Task.countDocuments({ assignedTo: userId, status: { $in: ["todo", "inprogress"] } })
    ]);

    // 4️⃣ Single Response Render
    res.render("dashboard", {
      user: req.user,
      activeProjects,
      creatorProjects,
      userJoinRequests,
      title: "Dashboard",
      stats: {
        activeProjects: activeProjects.length,
        teamMembers: teamMemberSet.size,
        completedTasks,
        pendingTasks,
      },
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).send("Failed to load dashboard ❌");
  }
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

    res.render("Projects", {
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
  res.render("Groups", { groups, user: req.user });
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




const File = require("../model/fileModel"); // 🔥 make sure this is imported

router.get("/project/:id", isLoggedIn, async (req, res) => {

  const project = await projectModel.findById(req.params.id)
    .populate("creator")
    .populate("members")
    .populate("joinRequests.user");

  // 🔥 FETCH FILES FOR THIS PROJECT
  const files = await File.find({ project: req.params.id })
    .populate("uploadedBy");

  console.log(files); // optional debug

  res.render("specificProject", {
    project,
    files,           // 🔥 SEND FILES TO EJS
    user: req.user,
    isLoggedIn: req.user
  });
});



module.exports = router;
