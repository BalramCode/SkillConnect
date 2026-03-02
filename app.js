require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // Dependency for token verification
const cookieParser = require("cookie-parser"); // Dependency for reading cookies

const app = express();
const usersRouter = require("./routes/usersRouter");
const groupsRouter = require("./routes/groupsRouter");
const projectsRouter = require("./routes/projectsRouter");
const navRouter = require("./routes/navRouter");
const requestRouter = require("./routes/requestRouter");
const searchRouter = require("./routes/searchRouter");
const ChatMessage = require("./model/messageModel");
const Project = require("./model/projectModel");

const userModel = require("./model/userModel");

// Middleware Setup
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // 3. IMPORTANT: Re-added cookie-parser middleware

// Serve uploaded files
// app.use("/projects/uploads/files", express.static("uploads/files"));
app.use("/users", usersRouter);
app.use("/groups", groupsRouter);
app.use("/projects", projectsRouter);
app.use("/nav", navRouter);
app.use("/requestRoute", requestRouter);
app.use("/search", searchRouter);

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Mongodb Connected");
  })
  .catch((err) => {
    // Log the error for better debugging
    console.error("Mongodb not connected:", err.message);
  });

const uploadRoute = require("./routes/uploadRoute");

app.use("/api", uploadRoute);

console.log(
  process.env.GITHUB_TOKEN
    ? "GitHub Token Loaded"
    : "Token Missing"
);
// Root Route
app.get("/", (req, res) => {
  res.render("index");
});

// app.listen(process.env.PORT || 3000, () => {
//   console.log(`Server is Live on port ${process.env.PORT || 3000}`);
// });

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const server = http.createServer(app);

// projectId -> Set of usernames
const onlineUsers = {};

// Attach Socket.IO
const io = new Server(server);

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // store user info on socket
  socket.username = null;
  socket.projectId = null;

  // 1️⃣ Join project room
  socket.on("join-project", async ({ projectId, username, userId }) => {
    const project = await Project.findById(projectId);

    // 🚫 BLOCK: project not found
    if (!project) {
      socket.emit("not-allowed", "Project not found");
      return;
    }

    // 🚫 BLOCK: user is NOT a member
    const isMember = project.members.some(
      (id) => id.toString() === userId
    );

    if (!isMember) {
      socket.emit("not-allowed", "Join the project to chat");
      return;
    }

    // ✅ ALLOWED: user is a member
    const roomName = `project_${projectId}`;
    socket.join(roomName);

    socket.username = username;
    socket.projectId = projectId;

    if (!onlineUsers[projectId]) {
      onlineUsers[projectId] = {};
    }

    onlineUsers[projectId][username] = socket.id;

    io.to(roomName).emit("online-users", {
      users: Object.keys(onlineUsers[projectId]),
    });

    console.log(`🟢 ${username} joined chat (AUTHORIZED)`);
  });


  // 2️⃣ Receive & broadcast message
  socket.on("send-message", async ({ projectId, message, sender }) => {
    // 🚫 BLOCK if user never joined project room
    if (
      socket.projectId !== projectId ||
      !socket.username ||
      socket.username !== sender
    ) {
      console.log("🚫 Message blocked (not a project member)");
      return;
    }

    const time = new Date().toLocaleTimeString();

      await ChatMessage.create({
        project: projectId,
        sender: sender,   // This is a username string
        receiver: null,   // Projects don't have a single receiver
        message,
        time,
      });

      const roomName = `project_${projectId}`;
      io.to(roomName).emit("receive-message", {
        message,
        sender,
        time,
      });


    console.log("💾 Message saved & broadcasted (AUTHORIZED)");
  });


  // 3️⃣ Handle disconnect
  socket.on("disconnect", () => {
    const { projectId, username } = socket;

    if (
      projectId &&
      username &&
      onlineUsers[projectId] &&
      onlineUsers[projectId][username] === socket.id
    ) {
      delete onlineUsers[projectId][username];

      io.to(`project_${projectId}`).emit("online-users", {
        users: Object.keys(onlineUsers[projectId]),
      });

      console.log(`🔴 ${username} went offline`);
    } else {
      console.log("🔴 Socket disconnected:", socket.id);
    }
  });


  // ================= PRIVATE CHAT (DM) =================

  // Join private room
  socket.on("join-private", ({ userId, targetUserId }) => {

    const roomName = "private_" + [userId, targetUserId].sort().join("_");

    socket.join(roomName);

    console.log(`🟢 Joined private chat room: ${roomName}`);
  });


  // Send private message
socket.on("private-message", async ({ senderId, receiverId, message }) => {
  try {
    // 1. DEFINE the time variable first!
    const time = new Date().toLocaleTimeString(); 

    // 2. Save to MongoDB
    const newMessage = await ChatMessage.create({
      sender: senderId,
      receiver: receiverId,
      message,
      time // Now 'time' is defined and won't crash
    });

    // 3. Broadcast the message
    io.emit("receive-private-message", {
      senderId,
      receiverId,
      message,
      time,
      createdAt: newMessage.createdAt
    });

    console.log("💬 Private message sent and saved");
  } catch (err) {
    console.error("Private message error:", err);
  }
});

});

// Github Setup
require("./config/passportGithub");
const session = require("express-session");
const passport = require("passport");

// SESSION FIRST
app.use(
  session({
    secret: "skillconnectsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,        // true only in production with HTTPS
      httpOnly: true,
      sameSite: "lax",      // VERY IMPORTANT for OAuth redirects
    },
  })
);
app.get("/check-session", (req, res) => {
  console.log("SESSION USER:", req.user);
  res.json({ user: req.user });
});


// THEN PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// Github OAuth Connection
const githubAuthRoutes = require("./routes/githubAuth");
app.use(githubAuthRoutes);


// Start server
server.listen(PORT, () => {
  console.log(`Server + Socket.IO running on port ${PORT}`);
});
