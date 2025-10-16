const express = require("express");
const cartCtrl = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add-to-cart", protect, cartCtrl.addToCart);

router.post("/remove", protect, cartCtrl.removeFromCart);

router.post("/clear", protect, cartCtrl.clearCart);

router.get("/:userId", protect, cartCtrl.getUserCart);

module.exports = router;
