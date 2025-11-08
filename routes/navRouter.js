const express = require("express");
const router = express.Router();
const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

router.get("/dashboard", (req, res) => {
    res.render("Dashboard");
})
router.get("/projects", (req, res) => {
    res.render("Projects");
})
router.get("/groups", (req, res) => {
    res.render("Groups");
})
router.get("/chat", (req, res) => {
    res.render("Chat");
})
router.get("/setting", (req, res) => {
    res.render("Setting");
})

module.exports = router;