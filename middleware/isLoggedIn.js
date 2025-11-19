const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel");

module.exports = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/loginregister");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // 🔥 Use ID from token (not email)
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      res.clearCookie("token");
      return res.redirect("/loginregister");
    }

    req.user = user;  // attach user to request
    next();

  } catch (error) {
    res.clearCookie("token");
    return res.redirect("/loginregister");
  }
};
