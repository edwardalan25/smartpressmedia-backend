const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");

const CartItems = sequelize.define(
  "CartItems",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "carts",
        key: "id",
      },
    },
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "books",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: "Quantity must be at least 1",
        },
      },
    },
    additionalMetaData: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "cart_items",
    timestamps: false,
    indexes: [
      { fields: ["cartId"], name: "idx_cart_items_cartId" },
      { fields: ["bookId"], name: "idx_cart_items_bookId" },
    ],
  }
);

CartItems.associate = (models) => {
  CartItems.belongsTo(models.Cart, { foreignKey: 'cartId', onDelete: 'CASCADE' });
  CartItems.belongsTo(models.Book, { foreignKey: 'bookId', onDelete: 'RESTRICT' });
};

module.exports = CartItems;
