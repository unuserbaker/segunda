const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const vehicleTypes = sequelize.define(
  "vehicle_types",
  {
    vehicle_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    strCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    activo: {
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
