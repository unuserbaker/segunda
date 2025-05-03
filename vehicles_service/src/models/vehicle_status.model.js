const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const vehicleStatus = sequelize.define(
  "vehicle_status",
  {
    vehicle_status_id: {
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
    tableName: "vehicle_status",
    indexes: [
      {
        unique: true,
        fields: ["vehicle_status_id"],
      },
    ],
    schema: config.schemaOne,
  }
);

module.exports = vehicleStatus;
