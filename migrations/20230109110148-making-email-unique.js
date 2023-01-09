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
    await queryInterface.changeColumn("Admins", "email", {
      type: Sequelize.STRING,
      unique: true
    });
  },

  // eslint-disable-next-line no-unused-vars
  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.changeColumn("Admins", "email", {
      type: Sequelize.STRING,
      unique: false
    });
  
  }
};
