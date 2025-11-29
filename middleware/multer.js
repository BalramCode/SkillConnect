const multer = require("multer");
const path = require("path");

// Storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/files");   // folder for uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

// File filter (optional)
const fileFilter = (req, file, cb) => {
  cb(null, true); 
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

module.exports = upload;
