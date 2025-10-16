const { sequelize } = require("../configs/database");

const User = require("./User");
const Author = require("./Author");
const Category = require("./Category");
const Product = require("./Product");
const Cart = require("./Cart");
const CartItem = require("./CartItem");

Product.belongsTo(Author, { foreignKey: "authorId", as: "author" });
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

Author.hasMany(Product, { foreignKey: "authorId", as: "products" });
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });

Cart.belongsTo(User, { foreignKey: "userId", as: "user" });
Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items" });

CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });
CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

User.hasOne(Cart, { foreignKey: "userId", as: "cart" });

module.exports = {
  User,
  Author,
  Category,
  Product,
  Cart,
  CartItem,
};
