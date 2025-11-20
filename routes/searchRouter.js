const express = require("express");
const router = express.Router();
const userModel = require("../model/userModel");
const groupModel = require("../model/groupModel");
const projectModel = require("../model/projectModel");
const isLoggedIn = require("../middleware/isLoggedIn");

router.get("/getResult", isLoggedIn, async (req, res) => {
  const search = req.query.search || "";
  try {
    const projects = await projectModel.find({
      projectName: { $regex: search, $options: "i" },
    });

    const message = req.query.message || null;

    res.render("Projects", {
      projects,
      user: req.user,  // NOW THIS EXISTS
      message,
    });
  } catch (error) {
    console.log(error);
    res.send("Something wrong");
  }
});


module.exports = router;
