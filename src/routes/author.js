const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const authorCtrl = require("../controllers/authorController");
const { body } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

const router = express.Router();

// Route  POST /api/author/add
// desc   Add new author to the database
router.post(
  "/add",
  protect,
  authorCtrl.addAuthor
);

// Route  GET /api/author/get
// desc   Return all the authors
router.get("/get", protect, authorCtrl.getAllAuthors);


// Route  GET /api/author/:id
// desc   Returns perticular author details
router.get("/:id", protect, authorCtrl.authorDetails);


module.exports = router;
