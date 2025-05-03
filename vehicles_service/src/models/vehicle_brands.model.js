const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const vehicleBrands = sequelize.define(
  "vehicle_brands",
  {
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    str_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: false,
    tableName: "vehicle_brands",
    indexes: [
      {
        unique: true,
        fields: ["brand_id"],
      },
    ],
    schema: config.schemaOne,
  }
);

module.exports = vehicleBrands;
