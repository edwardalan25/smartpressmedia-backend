const jwt = require("jsonwebtoken");
const User = require("../model/User");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }
      next();
    } catch (error) {
      next(error);
    }
  } else {
    res.status(401);
    next(new Error("Not authorized, no token"));
  }
};

module.exports = { protect };
