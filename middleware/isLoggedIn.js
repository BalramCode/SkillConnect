// Middleware: isLoggedIn.js (Example)
const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel");

module.exports = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    // If no token, user is not logged in. Redirect to login.
    return res.redirect("/loginregister");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await userModel.findOne({ email: decoded.email }).select('-password');

    if (!user) {
      // Token is valid but user doesn't exist (e.g., deleted user)
      res.clearCookie("token");
      return res.redirect("/loginregister");
    }

    // Attach the fetched user object to the request
    req.user = user;
    next();
  } catch (error) {
    // Catches expired or invalid JWT
    res.clearCookie("token");
    return res.redirect("/loginregister");
  }
};