const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const vehicleTypes = sequelize.define(
  "vehicle_types",
  {
    vehicle_type_id: {
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
    timestamps: true,
    tableName: "vehicle_types",
    indexes: [
      {
        unique: true,
        fields: ["vehicle_type_id"],
      },
    ],
    schema: config.schemaOne,
  }
);

module.exports = vehicleTypes;
