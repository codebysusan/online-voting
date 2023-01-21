'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Result extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Result.belongsTo(models.Election, {
        foreignKey: "electionId"
      });
    }
  }
  Result.init({
    votersId: DataTypes.STRING,
    optionId: DataTypes.INTEGER,
    questionId: DataTypes.INTEGER,
    electionId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Result',
  });
  return Result;
};