const express = require("express");
const router = express.Router();
const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const isLoggedIn = require("../middleware/isLoggedIn");


// GET: render login/register page
const projectModel = require("../model/projectModel");
const Task = require("../model/taskModel");

router.get("/loginregister", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.render("loginregister");
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const u = await userModel.findOne({ email: decoded.email });

    if (!u) {
      res.clearCookie("token");
      return res.render("loginregister");
    }

    // =========================
    // ✅ CALCULATE DASHBOARD STATS
    // =========================
    const userId = u._id;

    const activeProjects = await projectModel.find({
      members: userId,
    });

    const teamMemberSet = new Set();
    activeProjects.forEach(project => {
      project.members.forEach(memberId =>
        teamMemberSet.add(memberId.toString())
      );
    });

    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "done",
    });

    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $in: ["todo", "inprogress"] },
    });

    // =========================
    // ✅ RENDER DASHBOARD WITH STATS
    // =========================
    return res.render("dashboard", {
      user: u,
      stats: {
        activeProjects: activeProjects.length,
        teamMembers: teamMemberSet.size,
        completedTasks,
        pendingTasks,
      },
    });

  } catch (error) {
    console.error("Authentication Error:", error.message);
    res.clearCookie("token");
    return res.render("loginregister");
  }
});


// POST: handle register form submission
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password, confirmpassword, university } = req.body;

    if (password !== confirmpassword) {
      return res.render("loginregister", {
        toastMessage: "Passwords do not match!",
        toastType: "error",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.render("loginregister", {
        toastMessage: "User already exists!",
        toastType: "error",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const createdUser = await userModel.create({
      fullname,
      email,
      password: hash,
      university,
    });

    const token = jwt.sign(
      { email: createdUser.email, id: createdUser._id },
      process.env.JWT_KEY
    );

    res.cookie("token", token, { httpOnly: true });

    // =========================
    // ✅ DASHBOARD STATS (NEW USER → ALL ZERO)
    // =========================
    const stats = {
      activeProjects: 0,
      teamMembers: 0,
      completedTasks: 0,
      pendingTasks: 0,
    };

    // =========================
    // ✅ RENDER DASHBOARD SAFELY
    // =========================
    return res.render("dashboard", {
      user: createdUser,
      stats,
    });

  } catch (err) {
    console.log(err);
    return res.render("loginregister", {
      toastMessage: "Something went wrong!",
      toastType: "error",
    });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const u = await userModel.findOne({ email });
    if (!u) {
      return res.render("loginregister", {
        toastMessage: "User not found. Please register first.",
        toastType: "error",
      });
    }

    const isMatch = await bcrypt.compare(password, u.password);
    if (!isMatch) {
      return res.render("loginregister", {
        toastMessage: "Invalid email or password.",
        toastType: "error",
      });
    }

    const token = jwt.sign(
      { email: u.email, id: u._id },
      process.env.JWT_KEY
    );
    res.cookie("token", token, { httpOnly: true });

    // =========================
    // ✅ CALCULATE DASHBOARD STATS
    // =========================
    const userId = u._id;

    const activeProjects = await projectModel.find({
      members: userId,
    });

    const teamMemberSet = new Set();
    activeProjects.forEach(project => {
      project.members.forEach(memberId =>
        teamMemberSet.add(memberId.toString())
      );
    });

    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "done",
    });

    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $in: ["todo", "inprogress"] },
    });

    // =========================
    // ✅ RENDER DASHBOARD WITH STATS
    // =========================
    return res.render("dashboard", {
      user: u,
      stats: {
        activeProjects: activeProjects.length,
        teamMembers: teamMemberSet.size,
        completedTasks,
        pendingTasks,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.render("loginregister", {
      toastMessage: "Something went wrong during login.",
      toastType: "error",
    });
  }
});

// Update profile
router.post("/edit/:id", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).send("Unauthorized");
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Prevent editing another user's profile
    if (decoded.id !== req.params.id) {
      return res
        .status(403)
        .send("Forbidden: You cannot edit another user's profile");
    }

    // 👇 ADD githubUsername here
    const { username,fullname, bio, email, university, githubUsername } = req.body;

    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.id,
      {
        username,
        fullname,
        bio,
        email,
        university,
        githubUsername, // 👈 SAVE IT
      },
      { new: true }
    );

    const loggedInUser = await userModel.findById(decoded.id);

    // Pass updated user to EJS
    return res.render("Profile", {
      user: updatedUser,
      loggedInUser,isLoggedIn: loggedInUser,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send("Error updating profile");
  }
});





router.post("/update-github", isLoggedIn, async (req, res) => {
  try {
    const { githubUsername } = req.body;

    if (!githubUsername) {
      return res.status(400).send("GitHub username required");
    }

    req.user.githubUsername = githubUsername.trim();
    await req.user.save();

    res.redirect("/profile"); // or wherever your profile page is
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to save GitHub username");
  }
});






module.exports = router;
