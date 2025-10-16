const express = require("express");
const productCtrl = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/add", protect, productCtrl.addProduct)
router.get("/all", protect, productCtrl.getAllProducts)
router.get("/:id", protect, productCtrl.getProductDetails)

module.exports = router;
