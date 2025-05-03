const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const engineTypes = sequelize.define(
  "engine_types",
  {
    engine_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true, // autoincremental en lugar de UUID
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
    tableName: "engine_types",
    indexes: [
      {
        unique: true,
        fields: ["engine_type_id"],
      },
    ],
    schema: config.schemaOne,
  }
);

module.exports = engineTypes;
