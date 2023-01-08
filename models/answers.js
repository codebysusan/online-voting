"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Answers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
      Answers.belongsTo(models.Questions, {
        foreignKey: "questionId",
      });
    }
    static addOptions(options, questionId) {
      return this.create({
        options,
        questionId,
      });
    }
  }
  Answers.init(
    {
      options: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Answers",
    }
  );
  return Answers;
};
