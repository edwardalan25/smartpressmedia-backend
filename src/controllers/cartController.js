const { Product, Cart, CartItem } = require("../model/index");

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId are required.",
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    let cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });

    if (cartItem) {
      cartItem.quantity += quantity || 1;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity: quantity || 1,
      });
    }

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully.",
      data: cartItem,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    next(error);
  }
};

const getUserCart = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "title", "price", "coverImageUrl"],
            },
          ],
        },
      ],
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "No cart found for this user.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully.",
      data: cart,
    });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "userId and productId are required.",
      });
    }

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found for this user.",
      });
    }

    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "This product is not in your cart.",
      });
    }

    await cartItem.destroy();

    res.status(200).json({
      success: true,
      message: "Product removed from cart successfully.",
    });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found for this user.",
      });
    }

    await CartItem.destroy({ where: { cartId: cart.id } });

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    next(error);
  }
};

module.exports = { addToCart, getUserCart, removeFromCart, clearCart };
