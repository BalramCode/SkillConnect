require("dotenv").config();
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

const userModel = require("./model/userModel");

// Middleware Setup
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // 3. IMPORTANT: Re-added cookie-parser middleware

app.use("/users", usersRouter);
app.use("/groups", groupsRouter);
app.use("/projects", projectsRouter);
app.use("/nav", navRouter);
app.use("/requestRoute", requestRouter);
app.use("/search", searchRouter);

// Database Connection
mongoose
  .connect(process.env.MONGODB_URl)
  .then(() => {
    console.log("Mongodb Connected");
  })
  .catch((err) => {
    // Log the error for better debugging
    console.error("Mongodb not connected:", err.message);
  });

// Root Route
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is Live on port ${process.env.PORT || 3000}`);
});
