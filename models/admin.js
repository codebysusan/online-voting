"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      Admin.hasMany(models.Election, {
        foreignKey: "adminId",
      });
    }

    static createAdmin(firstName,lastName,email,password){
      return this.create({firstName,
        lastName,
        email,
        password});
    }
  }
  Admin.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
          notNull: true,
          len:{
            min: 1
          }
        }
      },
      lastName:  {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email:  {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate:{
          notNull: true,
          isEmail: true,
        }
      },
      password:  {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
          notNull: true
        }
      },
    },
    {
      sequelize,
      modelName: "Admin",
    }
  );
  return Admin;
};
