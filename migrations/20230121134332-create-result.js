'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Results', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      votersId: {
        type: Sequelize.STRING
      },
      optionId: {
        type: Sequelize.INTEGER
      },
      questionId: {
        type: Sequelize.INTEGER
      },
      electionId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addConstraint("Results", {
      fields: ["electionId"],
      type: "foreign key",
      references: {
        table: "Elections",
        field: "id"
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Results');
  }
};