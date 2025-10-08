const express = require("express");
const passport = require("passport");
const {
  register,
  login
} = require("../controllers/authController");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

// @Route     POST /api/v1/register
// @Desc      Used to register the user
// @Returns   a 201 response with user details on success, or a 400/500 error on failure.
router.post("/register", validate("register"), register);

// @Route     POST /api/v1/login
// @Desc      Used for user login
// @Returns   a 201 response with user details on success, or a 400/500 error on failure.
router.post("/login", login);


module.exports = router;
