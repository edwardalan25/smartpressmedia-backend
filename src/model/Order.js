const { DataTypes } = require("sequelize");
const { sequelize } = require("../configs/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "shipped", "delivered", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    shippingDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    additionalMetaData: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    indexes: [
      { fields: ["userId"], name: "idx_orders_userId" },
      { fields: ["status"], name: "idx_orders_status" },
      { fields: ["paymentStatus"], name: "idx_orders_paymentStatus" },
    ],
  }
);

Order.associate = (models) => {
  Order.belongsTo(models.User, { foreignKey: "userId", onDelete: "CASCADE" });
};

module.exports = Order;
