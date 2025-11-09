const express = require("express");
const router = express.Router();
const groupModel = require("../model/groupModel");

// Show all groups page
router.get("/", async (req, res) => {
  try {
    const groups = await groupModel.find().sort({ createdAt: -1 });
    res.render("groups", { groups });
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to load groups ❌");
  }
});

router.post("/create", async (req, res) => {
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
      members,
      visibility,
      skill,
    });
    // return res.status(200).send("Group created successfully ✅");
    res.redirect("/groups");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to create group ❌");
  }
});

// router.get("/getGroups", async (req, res) => {
//   let groups = await groupModel.find();
//   res.render("Groups", groups);
// });

module.exports = router;
