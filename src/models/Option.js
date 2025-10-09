const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Option = sequelize.define(
  "Option",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "questions",
        key: "id",
      },
    },
    optionText: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    nextQuestionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "questions",
        key: "id",
      },
    },
    additionalMetaData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "options",
    timestamps: false,
    indexes: [
      { fields: ["questionId"], name: "idx_options_questionId" },
      { fields: ["nextQuestionId"], name: "idx_options_nextQuestionId" },
    ],
  }
);

Option.associate = (models) => {
  Option.belongsTo(models.Question, { 
    foreignKey: "questionId", 
    onDelete: "CASCADE" 
  });
  Option.belongsTo(models.Question, { 
    foreignKey: "nextQuestionId", 
    as: "NextQuestion", 
    onDelete: "SET NULL" 
  });
};

module.exports = Option;