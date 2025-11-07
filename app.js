require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // Dependency for token verification
const cookieParser = require("cookie-parser"); // Dependency for reading cookies

const app = express();
const usersRouter = require("./routes/usersRouter"); // Assuming this file exists and is correct

// Assuming ./model/userModel exports the compiled Mongoose Model
// Renaming from userSChema to userModel for correct usage below.
const userModel = require("./model/userModel"); 


// Middleware Setup
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // 3. IMPORTANT: Re-added cookie-parser middleware

app.use("/users", usersRouter);

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

// Root Route (Authentication Logic)
app.get("/", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      // No token → show login/register
      return res.render("index");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    // Find user by decoded email
    const user = await userModel.findOne({ email: decoded.email });

    if (!user) {
      // Invalid user → clear token + show login/register
      res.clearCookie("token");
      return res.render("index");
    }

    // ✅ If token is valid, render dashboard and pass user data
    // The user's full name is now available in EJS as 'userName'
    res.render("dashboard", { userName: user.name });

  } catch (error) {
    // This catches expired/invalid JWT errors as well
    console.error("Authentication Error:", error.message);
    res.clearCookie("token");
    res.render("index");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is Live on port ${process.env.PORT || 3000}`);
});