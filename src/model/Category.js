const { DataTypes } = require("sequelize");
const { sequelize } = require("../configs/database");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "categories",
    timestamps: true,
  }
);


// Category.associate = (models) => {
//   Category.hasMany(models.Product, {
//     foreignKey: "categoryId",
//     as: "products",
//   });
// };

module.exports = Category;
