const express = require("express");
const router = express.Router();
const projectModel = require("../model/projectModel");
const isLoggedIn = require("../middleware/isLoggedIn");

// Get all projects
router.get("/", isLoggedIn, async (req, res) => {
  try {
    const projects = await projectModel
      .find()
      .populate("creator")
      .populate("members")
      .sort({ createdAt: -1 });

    const message = req.query.message || null;  // <-- ADD THIS

    res.render("Projects", { projects, user: req.user, message }); // <-- PASS TO FRONTEND
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to load projects ❌");
  }
});


// Create project
router.post("/create", isLoggedIn, async (req, res) => {
  try {
    const { projectName, projectDescription, visibility, skill } = req.body;

    await projectModel.create({
      projectName,
      projectDescription,
      visibility,
      skill,
      creator: req.user._id, // <-- REQUIRED
      members: [req.user._id], // <-- creator is first member
    });

    res.redirect("/projects");
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to create project ❌");
  }
});

// View Specific Project
router.get("/project/:id", isLoggedIn, async (req, res) => {
  try {
    const project = await projectModel
      .findById(req.params.id)
      .populate("creator")
      .populate("members")
      .populate("joinRequests.user");

    if (!project) {
      return res.status(404).send("Project not found ❌");
    }

    res.render("specificProject", { project, user: req.user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to view project ❌");
  }
});

router.post("/newTask", async (req, res) => {
  res.send("hello jee")
})

module.exports = router;
