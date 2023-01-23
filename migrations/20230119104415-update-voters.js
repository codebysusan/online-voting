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

    queryInterface.changeColumn("Voters", "votersPassword",{
      type: Sequelize.STRING,
      allowNull: true
    });

    queryInterface.removeColumn("Voters", "voted");
  }
};
