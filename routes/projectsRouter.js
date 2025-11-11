// projectRouter.js
const express = require("express");
const router = express.Router();
const projectModel = require("../model/projectModel");
const userModel = require("../model/userModel");
const isLoggedIn = require("../middleware/isLoggedIn");

router.get("/", isLoggedIn, async (req, res) => {
  try {
    const projects = await projectModel.find().sort({ createdAt: -1 });
    res.render("Projects", { projects, user: req.user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to load projects ❌");
  }
});

router.post("/create", isLoggedIn, async (req, res) => {
  try {
    // Note: 'members' from req.body likely represents the initial member count/name.
    // In a real app, you'd likely initialize an array of user IDs.
    const { projectName, projectDescription, visibility, skill } = req.body;
    
    // Defaulting 'members' to 1 (the creator) if not explicitly sent, or using a basic field from the body.
    const initialMembers = req.body.members || 1; 

    await projectModel.create({
      projectName,
      projectDescription,
      members: initialMembers, // Use the extracted or default value
      visibility,
      skill,
      // OPTIONAL: Associate the creator's ID with the project
      // creator: req.user._id // Uncomment this and include it in the model for a real app
    });

    res.redirect("/projects");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to create project ❌");
  }
});

router.get("/project/:_id", isLoggedIn, async (req, res) => {
  try {
    // FIX: Access the project ID from req.params
    const projectId = req.params._id; 
    
    // Find the project using the ID
    const project = await projectModel.findOne({ _id: projectId });

    if (!project) {
        return res.status(404).send("Project not found 🛑");
    }

    res.render("specificProject", { project, user: req.user });
  } catch (error) {
    console.log(error);
    // Mongoose cast error for invalid ID format will land here
    return res.status(500).send("Failed to view project ❌");
  }
});

module.exports = router;