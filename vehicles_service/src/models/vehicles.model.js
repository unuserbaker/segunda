const { DataTypes } = require("sequelize");
const sequelize = require("#DB/sequelize");
const config = require("../config/index");

const vehicles = sequelize.define(
  "vehicles",
  {
    vehicle_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vehicle_categories",
        key: "category_id",
      },
      onDelete: "SET NULL",
    },
    brand_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vehicle_brands",
        key: "brand_id",
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
    engine_type_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "engine_types",
        key: "engine_type_id",
      },
      onDelete: "SET NULL",
    },
    vehicle_type_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vehicle_types",
        key: "vehicle_type_id",
      },
      onDelete: "SET NULL",
    },
    transmission_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vehicle_transmissions",
        key: "transmission_id",
      },
      onDelete: "SET NULL",
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    //pendiente status
  },
  {
    timestamps: true,
    tableName: "vehicles",
    schema: config.schemaOne,
  }
);

module.exports = vehicles;
