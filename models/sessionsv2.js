'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SessionsV2 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SessionsV2.init({
    time: DataTypes.STRING,
    Address: DataTypes.STRING,
    countOfPlayers: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SessionsV2',
  });
  return SessionsV2;
};