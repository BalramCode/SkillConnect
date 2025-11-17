const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
  },

  projectDescription: String,

  // ---------------------------
  // MEMBERS (REAL USER IDs)
  // ---------------------------
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      unique:true,
      ref: "User",
    }
  ],

  // ---------------------------
  // JOIN REQUESTS
  // ---------------------------
  joinRequests: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],

  // project creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  visibility: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },

  skill: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Project", projectSchema);
