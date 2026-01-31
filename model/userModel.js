const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    trim: true,
    default: "New User",
  },

  username: {
    type: String,
    trim: true,
    unique: true,
    default: "user_dev",
  },

  email: {
    type: String,
    unique: true,
    required: true,
  },

  university: {
    type: String,
    default: "Not Specified",
  },

  bio: {
    type: String,
    trim: true,
    default:
      "Full-stack developer passionate about creating innovative solutions. Currently pursuing Computer Science with a focus on AI and machine learning. Love building products that make a difference.",
  },

  // 🔥 ADD THIS FIELD
  githubUsername: {
    type: String,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  confirmpassword: {
    type: String,
  },
});

module.exports = mongoose.model("User", userSchema);
