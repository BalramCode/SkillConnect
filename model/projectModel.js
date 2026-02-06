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
      ref: "User",
      // ❌ unique removed (VERY IMPORTANT)
    },
  ],

  // ---------------------------
  // KEY OBJECTIVES (REAL DATA)
  // ---------------------------
  objectives: [
    {
      title: {
        type: String,
        required: true,
      },

      targetValue: {
        type: Number, // e.g. 40
      },

      unit: {
        type: String, // %, tasks, users, etc.
        default: "%",
      },

      currentValue: {
        type: Number,
        default: 0,
      },

      updateMode: {
        type: String,
        enum: ["manual", "auto"],
        default: "manual",
      },

      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
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
    },
  ],

  // ---------------------------
  // PROJECT CREATOR
  // ---------------------------
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // ---------------------------
  // VISIBILITY & SKILL
  // ---------------------------
  visibility: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },

  skill: {
    type: String,
    required: true,
  },

  // ---------------------------
  // GITHUB INTEGRATION (🔥 NEW)
  // ---------------------------
  repoUrl: {
    type: String,
  },

  cloneUrl: {
    type: String,
  },

  // ---------------------------
  // TIMESTAMP
  // ---------------------------
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Project", projectSchema);
