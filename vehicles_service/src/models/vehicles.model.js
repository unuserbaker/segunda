const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const vehicles = sequelize.define(
  "vehicles",
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "categories",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "brands",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    mileage: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    plate: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[A-Z0-9]{1,10}$/,
      },
    },
    engine_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "engine_types",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "types",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    transmission_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "transmissions",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "status",
        key: "id",
      },
      onDelete: "SET NULL",
    },
  },
  {
    timestamps: false,
    tableName: "vehicles",
    schema: config.schemaOne,
  }
);

module.exports = vehicles;
