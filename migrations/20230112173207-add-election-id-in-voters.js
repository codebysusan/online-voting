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
    await queryInterface.addColumn("Voters","electionId",{
      type: Sequelize.DataTypes.INTEGER
    });

    await queryInterface.addConstraint("Voters",{
      fields: ["electionId"],
      type: "foreign key",
      references:{
        table: "Elections",
        field: "id",
      }
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

    queryInterface.removeColumn("Voters", "electionId");
  }
};
