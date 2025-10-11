const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

// redirect to google login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true in production
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.redirect(`http://localhost:5173/auth-success`);
      //   res.redirect(`http://localhost:5173/auth-success?token=${token}`);
    } catch (error) {
      console.error("google oauth error");
      //   res.redirect("http://localhost:5173/login?error=google_failed");
      res.redirect("http://localhost:5173/");
    }
  }
);

module.exports = router;
