"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("players", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sessionId: {
        type: Sequelize.INTEGER,
      },
      sportmatch: {
        type: Sequelize.STRING,
      },
      playerNames: {
        type: Sequelize.STRING,
        allowNull: false,
        get() {
          return this.getDataValue("players").split(",");
        },
        set(val) {
          this.setDataValue("players", val.join(","));
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("players");
  },
};
