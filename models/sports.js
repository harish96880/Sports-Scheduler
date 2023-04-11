"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sports extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async deleteSport({ id }) {
      return this.destroy({
        where: {
          id: id,
        },
      });
    }
  }
  Sports.init(
    {
      Sports_Name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Sports",
    }
  );
  return Sports;
};
