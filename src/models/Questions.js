const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Question = sequelize.define(
  "Question",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    questionText: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isRoot: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    additionalMetaData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "questions",
    timestamps: false,
    indexes: [
      { fields: ["isRoot"], name: "idx_questions_isRoot" },
    ],
  }
);

Question.associate = (models) => {
  Question.hasMany(models.Option, { 
    foreignKey: "question_id", 
    onDelete: "CASCADE" 
  });
  Question.hasMany(models.Option, { 
    foreignKey: "next_question_id", 
    as: "NextQuestions", 
    onDelete: "SET NULL" 
  });
};

module.exports = Question;