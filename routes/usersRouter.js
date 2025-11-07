const express = require("express");
const router = express.Router();
const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// GET: render login/register page
router.get("/loginregister", (req, res) => {
  res.render("loginregister", { toastMessage: "", toastType: "" });
});

// POST: handle register form submission
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password, confirmpassword, university } = req.body;

    // Check if passwords match
    if (password !== confirmpassword) {
      return res.render("loginregister", {
        toastMessage: "Passwords do not match!",
        toastType: "error",
      });
    }
    // Check if user already exists
    const user = await userModel.findOne({ email });
    if (user) {
      return res.render("loginregister", {
        toastMessage: "User already exists!",
        toastType: "error",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user
    const createdUser = await userModel.create({
      fullname,
      email,
      password: hash,
      university,
    });

    // Create JWT token
    const token = jwt.sign(
      { email: createdUser.email, id: createdUser._id },
      process.env.JWT_KEY
    );

    // Set token as HTTP-only cookie
    res.cookie("token", token, { httpOnly: true });

    // console.log("Form Data:", req.body);

    // Show success toast
    return res.render("dashboard", {
      toastMessage: "User Registered successful!",
      toastType: "success",
    });
  } catch (err) {
    console.log(err);
    res.render("loginregister", {
      toastMessage: "Something went wrong!",
      toastType: "error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ find user properly
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.render("loginregister", {
        toastMessage: "User not found. Please register first.",
        toastType: "error",
      });
    }

    // ✅ compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("loginregister", {
        toastMessage: "Invalid email or password.",
        toastType: "error",
      });
    }

    // ✅ generate token
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_KEY
    );

    // ✅ set cookie
    res.cookie("token", token, { httpOnly: true });

    // ✅ render toast or redirect
    return res.render("dashboard", {
      toastMessage: "Login successful!",
      toastType: "success",
    });
    // res.send("login successful");
  } catch (error) {
    console.error("Login error:", error);
    res.render("loginregister", {
      toastMessage: "Something went wrong during login.",
      toastType: "error",
    });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;
