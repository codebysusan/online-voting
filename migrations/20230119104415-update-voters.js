'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    
    queryInterface.changeColumn("Voters", "votersId",{
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    });

    queryInterface.changeColumn("Voters", "votersPassword",{
      type: Sequelize.STRING,
      allowNull: false
    });

    queryInterface.addColumn("Voters", "voted",{
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    queryInterface.changeColumn("Voters", "votersId", {
      type: Sequelize.STRING,
      unique: false,
      allowNull: true
    });

    queryInterface.changeColumn("Voters", "votersPassword",{
      type: Sequelize.STRING,
      allowNull: true
    });

    queryInterface.removeColumn("Voters", "voted");
  }
};
