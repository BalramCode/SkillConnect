const express = require("express");
const router = express.Router();
const userModel = require("../model/userModel");
const groupModel = require("../model/groupModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

router.get("/dashboard", (req, res) => {
  res.render("Dashboard");
});
router.get("/projects", (req, res) => {
  res.render("Projects");
});
router.get("/groups", async (req, res) => {
  const groups = await groupModel.find().sort({ createdAt: -1 });
  res.render("groups", { groups }); // ✅ now groups is defined
});
router.get("/chat", (req, res) => {
  res.render("Chat");
});
router.get("/setting", (req, res) => {
  res.render("Setting");
});
router.get("/profile", (req, res) => {
  res.render("Profile");
});

module.exports = router;
