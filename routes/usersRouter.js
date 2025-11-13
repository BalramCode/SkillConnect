const express = require("express");
const router = express.Router();
const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// GET: render login/register page
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

    // If token is valid, redirect to the dashboard with the user object
    return res.render("dashboard", { user: u });
  } catch (error) {
    console.error("Authentication Error:", error.message);
    res.clearCookie("token");
    // Change: Render loginregister if auth fails, as index wasn't defined
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

    return res.render("dashboard", { user: createdUser });
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

    const token = jwt.sign({ email: u.email, id: u._id }, process.env.JWT_KEY);
    res.cookie("token", token, { httpOnly: true });

    return res.render("dashboard", { user: u });
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
    const { username, bio, email, university } = req.body;

    // Find and update the user, and return the updated document
    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.id,
      { username, bio, email, university },
      { new: true } // returns the updated user
    );

    // If user not found
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    // Render with the updated user data
    res.render("Profile", { user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating profile");
  }
});


module.exports = router;
