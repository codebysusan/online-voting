"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Voters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      // define association here
      Voters.belongsTo(models.Election,{
        foreignKey: "electionId"
      });
    }

    static createVoters(voterId, password, electionId){
      return this.create({
        votersId: voterId,
        votersPassword: password,
        electionId,
      });
    }
  }

  Voters.init(
    {
      votersId: DataTypes.STRING,
      votersPassword: DataTypes.STRING,
      electionId: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: "Voters",
    }
  );

  return Voters;
  
};
