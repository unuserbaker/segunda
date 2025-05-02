const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const engineTypes = sequelize.define(
  "engine_types",
  {
    engine_type_id: {
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
