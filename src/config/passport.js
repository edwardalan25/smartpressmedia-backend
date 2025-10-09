const passport = require("passport");
const User = require("../models/User");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        // Validate profile data
        if (!profile.emails || !profile.emails[0]?.value) {
          return cb(new Error("Email not provided by Google"));
        }

        let user = await User.findOne({ where: { googleId: String(profile.id) } });
        if (!user) {
          user = await User.create({
            googleId: String(profile.id),
            username: profile.displayName || `user_${profile.id}`,
            email: profile.emails[0].value,
            avatar:
              profile.photos && profile.photos[0]?.value
                ? profile.photos[0].value
                : null,
            password: null,
            role: "user",
          });
        } else {
          await user.update({
            username: profile.displayName || user.username,
            email: profile.emails[0].value,
            avatar:
              profile.photos && profile.photos[0]?.value
                ? profile.photos[0].value
                : user.avatar,
          });
        }
        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    }
  )
);


module.exports = passport;
