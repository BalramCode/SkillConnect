const express = require("express");
const router = express.Router();
const groupModel = require("../model/groupModel");
const userModel = require("../model/userModel");
const isLoggedIn = require("../middleware/isLoggedIn"); // <--- Import middleware

// Show all groups page
router.get("/", isLoggedIn, async (req, res) => {
  try {
    const groups = await groupModel
      .find()
      .populate("creator")
      .populate("members")
      .sort({ createdAt: -1 });
    // Use req.user (logged-in user)
    res.render("groups", { groups, user: req.user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to load groups");
  }
});

router.post("/:id/join", async (req, res) => {
  res.send("Join hogya bhai tu");
})

router.post("/create", isLoggedIn, async (req, res) => {
  try {
    const {
      groupName,
      groupDescription,
      category,
      members,
      visibility,
      skill,
    } = req.body;

    await groupModel.create({
      groupName,
      groupDescription,
      category,
      visibility,
      skill,
      creator: req.user._id,
      members: [req.user._id],
    });

    // Redirect to the GET route, which will handle fetching the user
    res.redirect("/groups");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to create group ❌");
  }
});

module.exports = router;
