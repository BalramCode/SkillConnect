const express = require("express");
const router = express.Router();
const projectModel = require("../model/projectModel");
const isLoggedIn = require("../middleware/isLoggedIn");

// 1. Notifications Page
router.get("/notifications", isLoggedIn, async (req, res) => {
  try {
    const message = req.query.msg || null;
    const userId = req.user._id;

    // Requests YOU sent (Keep these as is, so user sees if they were rejected/pending)
    const userJoinRequests = await projectModel
      .find({ "joinRequests.user": userId })
      .populate("joinRequests.user")
      .sort({ createdAt: -1 });

    // Requests on YOUR projects 
    // FIX: Only send requests that are actually 'pending' to the creator
    const rawCreatorProjects = await projectModel
      .find({ creator: userId })
      .populate("joinRequests.user")
      .sort({ createdAt: -1 });

    // We filter the array manually to ensure the creator only sees "Pending" actions
    const creatorProjects = rawCreatorProjects.map(project => {
      const p = project.toObject(); // Convert to plain object to modify
      p.joinRequests = p.joinRequests.filter(r => r.status === 'pending');
      return p;
    });

    res.render("projectRequests", {
      user: req.user,
      userJoinRequests,
      creatorProjects, // Now only contains actionable pending requests
      message,
    });
  } catch (err) {
    res.status(500).send("Failed to load notifications ❌");
  }
});

// 2. Accept Request Logic
router.get("/project/:projectId/accept/:userId", isLoggedIn, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const project = await projectModel.findById(projectId);

    // SECURITY: Only the creator can accept requests
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    // Add to members if not already there
    if (!project.members.includes(userId)) {
      project.members.push(userId);
    }

    /* LOGIC CHANGE: 
       We remove the request from the 'joinRequests' array 
       because they are now a member. 
    */
    project.joinRequests = project.joinRequests.filter(
      (r) => r.user.toString() !== userId
    );

    await project.save();
    res.redirect(`/requestRoute/notifications?msg=accepted`);
  } catch (err) {
    res.status(500).send("Error accepting request");
  }
});

// 3. Reject Request Logic
router.get("/project/:projectId/reject/:userId", isLoggedIn, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const project = await projectModel.findById(projectId);

    // SECURITY: Only the creator can reject requests
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    /* OPTION A: Remove the request entirely (Cleaner)
       OPTION B: Keep it and mark as "rejected" (Good for history)
       I will go with OPTION B as per your original design, 
       but use a cleaner filter/update method.
    */
    const request = project.joinRequests.find(r => r.user.toString() === userId);
    if (request) {
      request.status = "rejected";
    }

    await project.save();
    res.redirect(`/requestRoute/notifications?msg=rejected`);
  } catch (err) {
    res.status(500).send("Error rejecting request");
  }
});

router.post("/join/:id", isLoggedIn, async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
    const userId = req.user._id.toString();

    // 1️⃣ Already a member?
    if (project.members.includes(userId)) {
      return res.redirect(`/projects?msg=already_member`);
    }

    // 🟢 IF PROJECT IS PUBLIC → DIRECT JOIN
    if (project.visibility === "public") {
      project.members.push(userId);
      await project.save();

      return res.redirect(`/projects/project/${project._id}`);
    }

    // 🔒 IF PROJECT IS PRIVATE → SEND REQUEST

    const existingRequest = project.joinRequests.find(
      r => r.user.toString() === userId
    );

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.redirect(`/projects?msg=already_requested`);
      }
      if (existingRequest.status === "rejected") {
        return res.redirect(`/projects?msg=request_rejected_previously`);
      }
    }

    project.joinRequests.push({ user: userId, status: "pending" });
    await project.save();

    res.redirect(`/projects?msg=request_sent`);

  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});


module.exports = router;