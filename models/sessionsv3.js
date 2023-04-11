'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SessionsV3 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SessionsV3.init({
    sportname2: DataTypes.STRING,
    time: DataTypes.STRING,
    Address: DataTypes.STRING,
    countOfPlayers: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SessionsV3',
  });
  return SessionsV3;
};