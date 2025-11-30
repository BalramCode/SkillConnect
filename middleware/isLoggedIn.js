const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel");

module.exports = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/users/loginRegister");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      res.clearCookie("token");
      return res.redirect("/users/loginRegister");
    }

    req.user = user;
    next();

  } catch (error) {
    res.clearCookie("token");
    return res.redirect("/users/loginRegister");
  }
};
