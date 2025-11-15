const express = require("express");
const router = express.Router();
const groupModel = require("../model/groupModel");
const userModel = require("../model/userModel");
const isLoggedIn = require("../middleware/isLoggedIn");
const projectModel = require("../model/projectModel");

router.get("/notifications", isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Find requests where THIS user is the requester
    const userJoinRequests = await projectModel
      .find({
        "joinRequests.user": userId,
      })
      .populate("joinRequests.user")
      .populate("creator")
      .sort({ createdAt: -1 });

    // 2️⃣ Find projects CREATED BY THIS USER (so they can see requests)
    const creatorProjects = await projectModel
      .find({
        creator: userId,
      })
      .populate("joinRequests.user")
      .populate("creator")
      .sort({ createdAt: -1 });

    res.render("projectRequests", {
      user: req.user,
      userJoinRequests,
      creatorProjects,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to load notifications ❌");
  }
});

// Join Request
router.post("/join/:id", isLoggedIn, async (req, res) => {
  const project = await projectModel.findById(req.params.id);

  project.joinRequests.push({ user: req.user._id });

  await project.save();
  res.redirect(`/projects/project/${req.params.id}`);
});

// creator can see the request
router.get("/project/:id/requests", isLoggedIn, async (req, res) => {
  const project = await projectModel
    .findById(req.params.id)
    .populate("joinRequests.user");

  if (project.creator.toString() !== req.user._id.toString()) {
    return res.status(403).send("Not allowed");
  }
  res.render("projectRequests.ejs", { project });
});

// Accept Request
router.get("/project/:projectId/accept/:userId", async (req, res) => {
  const project = await projectModel.findById(req.params.projectId);

  project.members.push(req.params.userId);

  project.joinRequests = project.joinRequests.map((r) =>
    r.user.toString() === req.params.userId ? { ...r, status: "accepted" } : r
  );

  await project.save();
  res.redirect(`/project/${req.params.projectId}/requests`);
});

// Reject Router
router.get("/project/:projectId/reject/:userId", async (req, res) => {
  const project = await projectModel.findById(req.params.projectId);

  project.joinRequests = project.joinRequests.map((r) =>
    r.user.toString() === req.params.userId ? { ...r, status: "rejected" } : r
  );

  await project.save();
  res.redirect(`/project/${req.params.projectId}/requests`);
});

module.exports = router;
