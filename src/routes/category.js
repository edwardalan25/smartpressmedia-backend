const express = require("express");
const categCtrl = require("../controllers/categoryController")
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// Method POST /api/category/add
// To add a new category
router.post("/add", protect, categCtrl.addCategory)

// Method GET /api/category/get
// To get all the Category for the drop downs
router.get("/get", protect, categCtrl.getAll)


module.exports = router;
