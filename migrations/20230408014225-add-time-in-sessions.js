"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Sessions", "time", {
      type: Sequelize.DataTypes.STRING,
    });

    await queryInterface.addConstraint("Sessions", {
      fields: ["time"],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Sessions", "time");
  },
};
