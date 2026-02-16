const mongoose = require("mongoose");
const chatMessageSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: false,
  },
  // Change these to String so they don't force ObjectId validation
  sender: {
    type: String, 
    required: true,
  },
  receiver: {
    type: String,
    required: false, // Optional because Project Chats don't have a specific receiver
  },
  message: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("ChatMessage", chatMessageSchema);