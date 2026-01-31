const express = require("express");
const router = express.Router();
const projectModel = require("../model/projectModel");
const isLoggedIn = require("../middleware/isLoggedIn");
const Task = require("../model/taskModel");
const multer = require("../middleware/multer");
const File = require("../model/fileModel");
const session = require("express-session");
const flash = require("connect-flash");

router.use(session({
  secret: "yourSecretKey",
  resave: false,
  saveUninitialized: true
}));
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

  const tasks = await Task.find({ project: req.params.id })
    .populate("assignedTo");

  const files = await File.find({ project: req.params.id })
    .populate("uploadedBy")
    .sort({ createdAt: -1 });

  res.render("specificProject", {
    project,
    tasks,
    files,
    user: req.user,        // 👈 already there
    isLoggedIn: req.user,  // ✅ ADD THIS
  });
});


// router.post("/newTask", async (req, res) => {
//   res.send("hello jee")
// })

router.post("/newTask", async (req, res) => {
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

      req.flash("success", "File uploaded successfully");
      res.redirect(`/projects/project/${req.params.id}`);
    } catch (err) {
      console.log(err);
      req.flash("error", "Something went wrong");
      res.redirect(`/projects/project/${req.params.id}`);
    }
  }
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
  const filePath = path.join(__dirname, "../uploads/files", req.params.filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error("Download error:", err);
      return res.status(404).send("File not found");
    }
  });
});



async function addCollaborator(repoUrl, githubUsername) {
  if (!githubUsername) return;

  const [owner, repo] = repoUrl
    .replace("https://github.com/", "")
    .split("/");

  await axios.put(
    `https://api.github.com/repos/${owner}/${repo}/collaborators/${githubUsername}`,
    {},
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  console.log(`INVITED ${githubUsername} TO ${repo}`);
}


const axios = require("axios");

router.post("/:id/start-coding", isLoggedIn, async (req, res) => {
  try {
    const project = await projectModel.findById(req.params.id);
//  console.log("LOGGED-IN USER:", {
//       id: req.user._id,
//       githubUsername: req.user.githubUsername,
//     });

// ✅ Auto-add member as collaborator
    if (req.user.githubUsername) {
      await addCollaborator(project.repoUrl, req.user.githubUsername);
    }
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // ✅ CASE 1: Repo already exists → reuse
    if (project.repoUrl && project.cloneUrl) {
      console.log("USING EXISTING REPO:", project.repoUrl);
      return res.json({
        status: "exists",
        repoUrl: project.repoUrl,
        cloneUrl: project.cloneUrl,
      });
    }

    // ✅ CASE 2: Repo does not exist → create ONCE
    const repoName =
      project.projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") +
      "-" +
      project._id.toString().slice(-5); // uniqueness

    console.log("CREATING GITHUB REPO:", repoName);

    const response = await axios.post(
      "https://api.github.com/user/repos",
      {
        name: repoName,
        description: project.projectDescription || "SkillConnect Project",
        private: false,
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

   

    

    // ✅ Save once → source of truth
    project.repoUrl = response.data.html_url;
    project.cloneUrl = response.data.clone_url;
    await project.save();

    console.log("REPO CREATED & SAVED:", project.repoUrl);

    return res.json({
      status: "created",
      repoUrl: project.repoUrl,
      cloneUrl: project.cloneUrl,
    });

  } catch (err) {
    console.error("START CODING ERROR:", err.response?.data || err);
    res.status(500).json({ error: "Start coding failed" });
  }
});










module.exports = router;
