const { DataTypes } = require("sequelize");
const { sequelize } = require("../configs/database");

const Order = sequelize.define(
  "Order",
  {
    
  },
  {
    tableName: "orders",
    timestamps: true,
  }
);

module.exports = Order;
