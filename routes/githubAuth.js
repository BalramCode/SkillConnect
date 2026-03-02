const express = require("express");
const router = express.Router();
const passport = require("passport");
const isLoggedIn=require("../middleware/isLoggedIn");
// STEP 1 — Login with GitHub
router.get("/auth/github", isLoggedIn, (req, res, next) => {
  // 1. Check if user is already connected
  if (req.user.githubId) {
    return res.redirect("/projects?message=Already connected to GitHub");
  }

  // 2. Save logged-in user ID in session manually
  req.session.connectUserId = req.user._id;

  passport.authenticate("github", {
    scope: ["user:email", "repo"],
  })(req, res, next);
});


// STEP 2 — GitHub callback
router.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    // ✅ Successful login/connection
    // If your project route is at GET "/projects", use that path here:
    res.redirect("/projects"); 
  }
);


module.exports = router;
