const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  originalname: String,
  size: Number,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("File", fileSchema);
