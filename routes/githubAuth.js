const express = require("express");
const router = express.Router();
const passport = require("passport");
const isLoggedIn=require("../middleware/isLoggedIn");
// STEP 1 — Login with GitHub
router.get("/auth/github", isLoggedIn, (req, res, next) => {
  // Save logged-in user ID in session manually
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
    // ✅ Successful login, session updated
        res.render("Setting", { user: req.user }); // or redirect to dashboard
// or your dashboard page
  }
);

// TEMP ROUTE to debug session
router.get("/me", (req, res) => {
  if (!req.user) return res.json({ message: "Not logged in" });
  res.json({
    _id: req.user._id,
    githubAccessToken: req.user.githubAccessToken,
    githubUsername: req.user.githubUsername,
    email: req.user.email
  });
});

module.exports = router;
