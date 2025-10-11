const User = require("../model/User");
const jwt = require("jsonwebtoken");
const { sanitizeUserInput } = require("../utils/sanitizeUser");
const { Op } = require("sequelize");

const register = async (req, res, next) => {
  try {
    // Sanitize input
    const sanitizedInput = sanitizeUserInput(req.body, true);

    // Check if user already exists
    const userExists = await User.findOne({
      where: { email: sanitizedInput.email },
    });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    // Create user
    const user = await User.create(sanitizedInput);

    // Generate tokens
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

const getAll = async (req, res, next) => {
  try {
    const users = await User.findAndCountAll({
      where: {
        id: { [Op.ne]: req.user.id },
      },
    });
    res.status(200).json({
      success: true,
      count: users.count,
      data: users.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getAll };
