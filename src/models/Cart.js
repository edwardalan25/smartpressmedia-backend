const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Cart = sequelize.define(
  "Cart",
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
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    additionalMetaData: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "carts",
    timestamps: true,
     indexes: [
      { fields: ["userId"], name: "idx_carts_userId" },
      { fields: ["sessionId"], name: "idx_carts_sessionId" },
    ],
  }
);

Cart.associate = (models) => {
  Cart.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
};

module.exports = Cart;
