"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
      Election.belongsTo(models.Admin, {
        foreignKey: "adminId",
      });
      Election.hasMany(models.Questions, {
        foreignKey: "electionId",
      });

      Election.hasMany(models.Voters, {
        foreignKey: "electionId"
      });

      Election.hasMany(models.Result, {
        foreignKey: "electionId"
      });
      
    }
    static addElection(title, adminId) {
      return this.create({
        title,
        presentStatus: "Added",
        adminId,
      });
    }

    static getAllElections(adminId) {
      return this.findAll({
        where: {
          adminId,
        },
      });
    }

    static getElection(id, adminId) {
      return this.findOne({
        where:{
          id,
          adminId
        }
      });
    }

    static getVotersElection(id){
      return this.findByPk(id);
    }
  }
  Election.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
          notNull: true,
          len: 1
        }
      },
      presentStatus: {
        type: DataTypes.STRING,
      },
      url: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Election",
    }
  );
  return Election;
};
