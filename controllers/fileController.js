const cloudinary = require("../config/cloudinary");
const File = require("../model/fileModel");

exports.uploadFile = async (req, res) => {
    try {
        const projectId = req.params.id;

        if (!req.file) {
            return res.redirect(`/projects/project/${projectId}`);
        }

        // 🔥 THIS IS THE IMPORTANT PART
        const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
            {
                resource_type: "raw",
                folder: "project-files",
                public_id: req.file.originalname,  // 🔥 THIS IS THE FIX
            }
        );


        await File.create({
            project: projectId,
            originalname: req.file.originalname,
            size: req.file.size,
            uploadedBy: req.user._id,
            url: result.secure_url,
            public_id: result.public_id,
        });

        res.redirect(`/projects/project/${projectId}`);

    } catch (err) {
        console.log(err);
        res.redirect("back");
    }
};



