"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.addColumn("Elections", "adminId", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Elections", {
      fields: ["adminId"],
      type: "foreign key",
      references: {
        table: "Admins",
        field: "id",
      },
    });
  },

  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn("Elections", "adminId");
  },
};
