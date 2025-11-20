const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
  },

  groupDescription: String,

  // REAL MEMBERS
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      unique:true,
      ref: "User",
    }
  ],

  // JOIN REQUESTS
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

  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  category: {
    type: String,
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

module.exports = mongoose.model("Group", groupSchema);
