const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const vehicleCategories = sequelize.define(
  "vehicle_categories",
  {
    category_id: {
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
    tableName: "vehicle_categories",
    indexes: [
      {
        unique: true,
        fields: ["category_id"],
      },
    ],
    schema: config.schemaOne,
  }
);

module.exports = vehicleCategories;
