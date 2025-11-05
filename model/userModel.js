const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
  },
  university: String,
  password: String,
  confirmpassword: String,
});

module.exports = new mongoose.model("User", userSchema);