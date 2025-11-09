const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
  },
  projectDescription: String,
  members: {
    type: Number,
    default: 1,
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
