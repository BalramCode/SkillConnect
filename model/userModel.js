const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    trim: true,
    default: "New User",
  },

  username: {
    type: String,
    unique: true,
    default: () => `user_${Math.floor(Math.random() * 100000)}`
  },


  email: {
    type: String,
    unique: true,
  },

  university: {
    type: String,
    default: "Not Specified",
  },

  bio: {
    type: String,
    trim: true,
    default:
      "Full-stack developer passionate about creating innovative solutions.",
  },

  password: {
    type: String,
  },

  confirmpassword: {
    type: String,
  },

  // 🔥 GitHub OAuth fields
  githubId: {
    type: String,
  },

  githubUsername: {
    type: String,
    trim: true,
  },

  githubAccessToken: {
    type: String,
  },
});

module.exports = mongoose.model("User", userSchema);
