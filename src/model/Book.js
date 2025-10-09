// models/Book.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Book = sequelize.define(
  "Book",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "authors",
        key: "id",
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    genres: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    ratings: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
    },
    additionalMetaData: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    coverImageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "books",
    timestamps: true,
    indexes: [
      { fields: ["title"], name: "idx_books_title" },
      { fields: ["authorId"], name: "idx_books_authorId" },
    ],
  }
);

Book.associate = (models) => {
  Book.belongsTo(models.Author, {
    foreignKey: "authorId",
    onDelete: "RESTRICT",
  });
};

module.exports = Book;
