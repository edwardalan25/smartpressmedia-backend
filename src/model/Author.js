const { DataTypes } = require("sequelize");
const { sequelize } = require("../configs/database");

const Author = sequelize.define(
  "Author",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    additionalMetaData: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "authors",
    timestamps: true,
    indexes: [{ fields: ["name"], name: "idx_authors_name" }],
  }
);

module.exports = Author;
