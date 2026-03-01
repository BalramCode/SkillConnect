const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../model/userModel");
const axios = require("axios");

passport.use(
  new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ["user:email", "repo"],
    passReqToCallback: true
  },

    async (req, accessToken, refreshToken, profile, done) => {
  try {

    const userId = req.session.connectUserId;

    if (!userId) {
      console.log("NO CONNECT USER ID FOUND");
      return done(null, false);
    }

    const user = await User.findById(userId);

    user.githubId = profile.id.toString();
    user.githubUsername = profile.username;
    user.githubAccessToken = accessToken;

    await user.save();

    return done(null, user);

  } catch (err) {
    console.error("GitHub Strategy Error:", err);
    return done(err, null);
  }
}


  )
);


// ======================
// Serialize & Deserialize
// ======================
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
