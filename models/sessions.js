"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class sessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static getSport(getItem) {
      return this.findAll({
        where: {
          sportname: getItem,
        },
      });
    }
  }
  sessions.init(
    {
      sportname: DataTypes.STRING,
      session: DataTypes.DATEONLY,
      time: DataTypes.STRING,
      Address: DataTypes.STRING,
      countOfPlayers: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "sessions",
    }
  );
  return sessions;
};
