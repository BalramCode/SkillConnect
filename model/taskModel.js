const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },

  title: { type: String },
  description: String,

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  priority: { type: String, enum: ["low", "medium", "high"], default: "low" },

  status: {
    type: String,
    enum: ["todo", "inprogress", "done"],
    default: "todo"
  },

  dueDate: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Task", taskSchema);
