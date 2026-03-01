const cloudinary = require("../config/cloudinary");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      resource_type: "raw",
      folder: "project-files",
      public_id: Date.now() + "-" + req.file.originalname,
    },
    (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }
  );

  stream.end(req.file.buffer);
});


    res.status(200).json({
      message: "File uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
