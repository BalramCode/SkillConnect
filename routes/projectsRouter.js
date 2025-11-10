// projectRouter.js
const express = require("express");
const router = express.Router();
const projectModel = require("../model/projectModel");
const userModel = require("../model/userModel");
const isLoggedIn = require('../middleware/isLoggedIn');

router.get("/", isLoggedIn, async (req, res) => {
  try {
    const projects = await projectModel.find().sort({ createdAt: -1 });
    // Use req.user (logged-in user)
    res.render("Projects", { projects, user: req.user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to load projects ❌");
  }
});

router.post("/create", isLoggedIn, async (req, res) => {
  try {
    const { projectName, projectDescription, members, visibility, skill } =
      req.body;

    await projectModel.create({
      projectName,
      projectDescription,
      members,
      visibility,
      skill,
      // OPTIONAL: Associate the creator's ID with the project
      // creator: req.user._id
    });

    // Remove {user} from redirect. The /projects GET route will fetch the user.
    res.redirect("/projects");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to create project ❌");
  }
});

module.exports = router;
