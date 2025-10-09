const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const QuizResponse = sequelize.define(
  "QuizResponse",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    recommendedBooks: {
      type: DataTypes.JSON,
      allowNull: true, 
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "quiz_responses", 
    timestamps: true,
  }
);

QuizResponse.associate = (models) => {
  QuizResponse.belongsTo(models.User, { 
    foreignKey: "userId", 
    onDelete: "SET NULL"
  });
};

module.exports = QuizResponse;