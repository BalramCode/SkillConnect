const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
  },
  groupDescription: String,
  members: {
    type: Number,
    default: 1,
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
