const express = require("express");
const { register, login, getAll } = require("../controllers/authController");
const { validate } = require("../middleware/validateMiddleware");
const authenticateUser = require("../middleware/auth");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @Route     POST /api/auth/register
// @Desc      Used to register the user
// @Returns   a 201 response with user details on success, or a 400/500 error on failure.
router.post("/register", validate("register"), register);

// @Route     POST /api/auth/login
// @Desc      Used for user login
// @Returns   a 201 response with user details on success, or a 400/500 error on failure.
router.post("/login", login);

// @Route     POST /api/auth/me
// @Desc      Used to return the oauth login user
router.get("/me", authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

router.get("/get", protect, getAll);

module.exports = router;
