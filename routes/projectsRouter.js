require('dotenv').config();
const express = require("express");
const router = express.Router();
const projectModel = require("../model/projectModel");
const isLoggedIn = require("../middleware/isLoggedIn");
const Task = require("../model/taskModel");
const Activity = require("../model//activityModel");
const multer = require("../middleware/multer");
const File = require("../model/fileModel");
const session = require("express-session");
const flash = require("connect-flash");
const ChatMessage = require("../model/messageModel");

router.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  }),
);
console.log(process.env.GITHUB_TOKEN ? "GitHub Token Loaded" : "Token Missing");

router.use(flash());

// Make flash messages available to all EJS templates
router.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Get all projects
router.get("/", isLoggedIn, async (req, res) => {
  try {
    const projects = await projectModel
      .find()
      .populate("creator")
      .populate("members")
      .sort({ createdAt: -1 });

    const message = req.query.message || null; // <-- ADD THIS

    res.render("Projects", { projects, user: req.user, message }); // <-- PASS TO FRONTEND
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to load projects ❌");
  }
});

// Create project
router.post("/create", isLoggedIn, async (req, res) => {
  try {
    const { projectName, projectDescription, visibility, skill } = req.body;

    await projectModel.create({
      projectName,
      projectDescription,
      visibility,
      skill,
      creator: req.user._id, // <-- REQUIRED
      members: [req.user._id], // <-- creator is first member
    });

    res.redirect("/projects");
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to create project ❌");
  }
});

// View Specific Project
router.get("/project/:id", isLoggedIn, async (req, res) => {
  const project = await projectModel
    .findById(req.params.id)
    .populate("creator")
    .populate("members")
    .populate("joinRequests.user");

  const tasks = await Task.find({ project: req.params.id }).populate(
    "assignedTo",
  );

  const files = await File.find({ project: req.params.id })
    .populate("uploadedBy")
    .sort({ createdAt: -1 });

    const messages = await ChatMessage.find({
      project: req.params.id,
    }).sort({ createdAt: 1 });

   const isMember = project.members.some(
  (member) => member._id.toString() === req.user._id.toString()
);



  // ✅ REAL STATS
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "inprogress").length;
  const teamMembers = project.members.length;

  // ✅ RECENT ACTIVITY (NEW)
  const activities = await Activity.find({ project: req.params.id })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(5);

  res.render("specificProject", {
    project,
    tasks,
    files,
    activities,
    messages,
    isMember,
    user: req.user,
    isLoggedIn: req.user,

    // stats
    totalTasks,
    completedTasks,
    inProgressTasks,
    teamMembers,
  });
});

// Add a key objective to project
router.post("/project/:id/objective", isLoggedIn, async (req, res) => {
  const { title, targetValue, unit } = req.body;

  await projectModel.findByIdAndUpdate(req.params.id, {
    $push: {
      objectives: {
        title,
        targetValue,
        unit,
        currentValue: 0,
      },
    },
  });

  res.redirect(`/projects/project/${req.params.id}`);
});

// router.post("/newTask", async (req, res) => {
//   res.send("hello jee")
// })

router.post("/newTask",isLoggedIn, async (req, res) => {
  try {
    const {
      project,
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      status,
    } = req.body;

    const task = await Task.create({
      project,
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      status,
    });

    // ✅ ADD THIS
    await Activity.create({
      project,
      user: req.user._id,
      type: "task_created",
      message: `created a new task "${title}"`,
    });

    // redirect user back to the specific project page
    res.redirect("/projects/project/" + project);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

router.post(
  "/project/:id/upload",
  isLoggedIn,
  multer.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        req.flash("error", "No file selected");
        return res.redirect(`/projects/project/${req.params.id}`);
      }

      await File.create({
        project: req.params.id,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user._id,
      });

      await Activity.create({
      project: req.params.id,
      user: req.user._id,
      type: "file_uploaded",
      message: `uploaded a file "${req.file.originalname}"`,
    });

      req.flash("success", "File uploaded successfully");
      res.redirect(`/projects/project/${req.params.id}`);
    } catch (err) {
      console.log(err);
      req.flash("error", "Something went wrong");
      res.redirect(`/projects/project/${req.params.id}`);
    }
  },
);

// Delete file
router.post("/file/delete/:id", isLoggedIn, async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");

  await File.findByIdAndDelete(req.params.id);

  res.redirect(`/projects/project/${file.project}`);
});

// Download file
router.get("/uploads/files/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "../uploads/files",
    req.params.filename,
  );

  res.download(filePath, (err) => {
    if (err) {
      console.error("Download error:", err);
      return res.status(404).send("File not found");
    }
  });
});

// Rendering my Projects
// My Projects (Joined OR Created)
router.get("/myprojects", isLoggedIn, async (req, res) => {
  try {
    const projects = await projectModel
      .find({
        $or: [{ creator: req.user._id }, { members: req.user._id }],
      })
      .populate("creator") // 👈 REQUIRED for creator.fullname
      .populate("members"); // optional but useful

    res.render("myProject", {
      user: req.user,
      isLoggedIn: true,
      projects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to load My Projects ❌");
  }
});

const axios = require("axios");

// ===============================
// ✅ CHECK IF REPO EXISTS
// ===============================
async function repoExists(repoUrl) {
  if (!repoUrl) return false;

  const [owner, repo] = repoUrl
    .replace("https://github.com/", "")
    .trim()
    .split("/");

  try {
    await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    return true;
  } catch (err) {
    console.log("Repo does not exist anymore.");
    return false;
  }
}

// ===============================
// ✅ ADD COLLABORATOR
// ===============================
async function addCollaborator(repoUrl, githubUsername) {
  if (!repoUrl || !githubUsername) return;

  const [owner, repo] = repoUrl
    .replace("https://github.com/", "")
    .trim()
    .split("/");

  try {
    await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/collaborators/${githubUsername}`,
      { permission: "push" },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    console.log(`INVITED ${githubUsername} TO ${repo}`);
  } catch (err) {
    console.error(
      "COLLABORATOR ERROR:",
      err.response?.data || err.message
    );
  }
}

// ===============================
// ✅ START CODING ROUTE
// ===============================
router.post("/:id/start-coding", isLoggedIn, async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);

    // 1️⃣ Project must exist
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 2️⃣ User must be a member
    const isMember = project.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        error: "Please join the project first",
      });
    }

    // ===============================
    // 3️⃣ REPO EXISTS IN DB → VERIFY
    // ===============================
    if (project.repoUrl && project.cloneUrl) {
      console.log("USING STORED REPO:", project.repoUrl);

      const exists = await repoExists(project.repoUrl);

      if (exists) {
        // Invite member safely
        await addCollaborator(
          project.repoUrl,
          req.user.githubUsername
        );

        return res.json({
          status: "exists",
          repoUrl: project.repoUrl,
          cloneUrl: project.cloneUrl,
        });
      } else {
        // Repo deleted from GitHub → reset DB
        console.log("Repo was deleted. Recreating...");
        project.repoUrl = undefined;
        project.cloneUrl = undefined;
        await project.save();
      }
    }

    // ===============================
    // 4️⃣ CREATE NEW REPO
    // ===============================
    const repoName =
      project.projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") +
      "-" +
      project._id.toString().slice(-5);

    console.log("CREATING GITHUB REPO:", repoName);

    const response = await axios.post(
      "https://api.github.com/user/repos",
      {
        name: repoName,
        description:
          project.projectDescription ||
          "SkillConnect Project",
        private: false,
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    // Save repo in DB
    project.repoUrl = response.data.html_url;
    project.cloneUrl = response.data.clone_url;
    await project.save();

    console.log("REPO CREATED & SAVED:", project.repoUrl);

    // Invite user
    await addCollaborator(
      project.repoUrl,
      req.user.githubUsername
    );

    return res.json({
      status: "created",
      repoUrl: project.repoUrl,
      cloneUrl: project.cloneUrl,
    });

  } catch (err) {
    console.error(
      "START CODING ERROR:",
      err.response?.data || err.message
    );

    return res
      .status(500)
      .json({ error: "Start coding failed" });
  }
});


module.exports = router;
