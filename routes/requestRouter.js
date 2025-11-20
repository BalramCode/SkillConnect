const express = require("express");
const router = express.Router();
const groupModel = require("../model/groupModel");
const userModel = require("../model/userModel");
const isLoggedIn = require("../middleware/isLoggedIn");
const projectModel = require("../model/projectModel");

router.get("/notifications", isLoggedIn, async (req, res) => {
  try {
    const message = req.query.msg || null; // <--- MESSAGE HERE

    const userId = req.user._id;

    const userJoinRequests = await projectModel
      .find({ "joinRequests.user": userId })
      .populate("joinRequests.user")
      .populate("creator")
      .sort({ createdAt: -1 });

    const creatorProjects = await projectModel
      .find({ creator: userId })
      .populate("joinRequests.user")
      .populate("creator")
      .sort({ createdAt: -1 });

    res.render("projectRequests", {
      user: req.user,
      userJoinRequests,
      creatorProjects,
      message, // <--- SEND TO FRONTEND
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to load notifications ❌");
  }
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

// Join Request
// Join Project
router.post("/join/:id", isLoggedIn, async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);

    if (!project) {
      return res.status(404).send("Project not found");
    }

    // Already a member?
    if (project.members.includes(req.user._id)) {
      return res.redirect(`/projects?message=already_member`);
    }

    // PUBLIC PROJECT ⇒ AUTO-JOIN
    if (project.visibility === "public") {
      project.members.push(req.user._id);
      await project.save();
      return res.redirect(`/projects/project/${project._id}`);
    }

    // Check if user already requested
    const alreadyRequested = project.joinRequests.some(
      (reqObj) => reqObj.user.toString() === req.user._id.toString()
    );

    if (alreadyRequested) {
      return res.redirect(`/projects?message=request_exists`);
    }

    project.joinRequests.push({ user: req.user._id });
    await project.save();

    return res.redirect(`/projects?message=request_sent`);

  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong ❌");
  }
});


// Accept Request
router.get("/project/:projectId/accept/:userId", async (req, res) => {
  const project = await projectModel.findById(req.params.projectId);

  if (!project.members.includes(req.params.userId)) {
    project.members.push(req.params.userId);
  }

  project.joinRequests = project.joinRequests.map((r) =>
    r.user.toString() === req.params.userId ? { ...r, status: "accepted" } : r
  );

  await project.save();

  // Redirect with query message
  res.redirect(`/requestRoute/notifications?msg=accepted`);
});

// Reject Request
router.get("/project/:projectId/reject/:userId", async (req, res) => {
  const project = await projectModel.findById(req.params.projectId);

  project.joinRequests = project.joinRequests.map((r) =>
    r.user.toString() === req.params.userId ? { ...r, status: "rejected" } : r
  );

  await project.save();

  // Redirect with message
  res.redirect(`/requestRoute/notifications?msg=rejected`);
});

module.exports = router;
