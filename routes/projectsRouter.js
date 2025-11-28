const express = require("express");
const router = express.Router();
const projectModel = require("../model/projectModel");
const isLoggedIn = require("../middleware/isLoggedIn");
const Task = require("../model/taskModel");

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
    const project = await projectModel.findById(req.params.id)
      .populate("creator")
      .populate("members")
      .populate("joinRequests.user");

    const tasks = await Task.find({ project: req.params.id })
      .populate("assignedTo")
      .sort({ createdAt: -1 });

    res.render("specificProject", {
      project,
      user: req.user,
      tasks
    });

  } catch (err) {
    res.status(500).send("Error loading project");
  }
});


// router.post("/newTask", async (req, res) => {
//   res.send("hello jee")
// })


router.post("/newTask", async (req, res) => {
  try {
    const { project, title, description, priority, assignedTo, dueDate, status } = req.body;

    const task = await Task.create({
      project,
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      status
    });

    // redirect user back to the specific project page
    res.redirect("/projects/project/" + project);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});




module.exports = router;
