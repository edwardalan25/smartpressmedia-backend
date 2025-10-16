const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");
const morgan = require("morgan");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const { sequelize } = require("./src/configs/database");
require("./src/configs/passport");

const authRoute = require("./src/routes/auth");
const oauthRoute = require("./src/routes/oauth");
const authorRoute = require("./src/routes/author");
const categoryRoutes = require("./src/routes/category");
const productRoutes = require("./src/routes/product");
const cartRoutes = require("./src/routes/cart")

const app = express();
app.use(cookieParser());

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

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

const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "Sessions",
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
});

sessionStore.sync();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "sessionsecret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

sequelize
  .sync({ alter: true }) 
  .then(() => console.log("Database & tables synced"))
  .catch((err) => console.error("DB sync error:", err));

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Server" });
});

// Main Application Routes

app.use("/api/auth", oauthRoute);
app.use("/api/auth", authRoute);
app.use("/api/author", authorRoute);
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
