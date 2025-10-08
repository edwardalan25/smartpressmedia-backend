const User = require("../models/User");

const jwt = require("jsonwebtoken");

const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || "user",
    });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    await user.update({ refreshToken });
    res.status(201).json({ success: true, token, refreshToken });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      throw new Error("Invalid credentials");
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    await user.update({ refreshToken });
    res.json({ success: true, token, refreshToken });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
