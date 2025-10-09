const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const OrderItems = sequelize.define(
  "Orderitems",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
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
    },
    priceAtPurchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "order_items",
    timestamps: false,
    indexes: [
      { fields: ["orderId"], name: "idx_order_items_orderId" },
      { fields: ["bookId"], name: "idx_order_items_bookId" },
    ],
  }
);


OrderItems.associate = (models) => {
  OrderItems.belongsTo(models.Order, { foreignKey: "orderId", onDelete: "CASCADE" });
  OrderItems.belongsTo(models.Book, { foreignKey: "bookId", onDelete: "RESTRICT" });
};

module.exports = OrderItems;
