const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const vehicleTransmissions = sequelize.define(
  "transmissions",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true, // Convertido a INTEGER autoincremental
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
    tableName: "transmissions",
    indexes: [
      {
        unique: true,
        fields: ["id"],
      },
    ],
    schema: config.schemaOne,
  }
);

module.exports = vehicleTransmissions;
