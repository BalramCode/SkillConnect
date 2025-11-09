const express = require("express");
const router = express.Router();
const projectModel = require("../model/projectModel"); 

router.post("/create", async (req, res) => {
  try {
    const {
      projectName,
      projectDescription,
      members,
      visibility,
      skill,
    } = req.body;

    await projectModel.create({
      projectName,
      projectDescription,
      members,
      visibility,
      skill,
    });
    return res.status(200).send("Project created successfully ✅");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to create project ❌");
  }
});

module.exports = router;
