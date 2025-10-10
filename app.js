const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");
const authRoute = require("./src/routes/auth");
const oauthRoute = require("./src/routes/oauth");
const questionsRoute = require("./src/routes/questions");
const morgan = require("morgan");
const session = require("express-session");
require("./src/configs/passport");

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors());

// for development only
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Server" });
});

// Main Application Routes
app.use("/api/auth", oauthRoute);
app.use("/api/auth", authRoute);
app.use("/api/quiz", questionsRoute);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
