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
    }
    static addElection(title){
      return this.create({
        title:title,
        presentStatus: "Added"
      });
    }

    static getElection(id){
      return this.findByPk(id);
    }
  }
  Election.init(
    {
      title: {
        type: DataTypes.STRING,
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
