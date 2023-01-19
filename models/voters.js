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

    static getVoter(votersId, electionId){
      return this.findOne({
        where:{
          votersId,
          electionId
        }
      });
    }
  }

  Voters.init(
    {
      votersId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate:{
          len:1,
          notNull:true
        }
      },
      votersPassword: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
          len:1,
          notNull: true
        }
      },
      electionId: {
        type: DataTypes.INTEGER
      }
    },
    {
      sequelize,
      modelName: "Voters",
    }
  );

  return Voters;
  
};
