const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },

  filename: String,
  originalname: String,
  size: Number,
  mimetype: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("File", fileSchema);
