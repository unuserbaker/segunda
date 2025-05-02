const sequelize = require("#DB/sequelize");
const config = require("../../config/index");
const { DataTypes } = require("sequelize");

const LogVehicles = sequelize.define(
  "log_vehicles",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    IDTHIS: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    brand_id: {
      type: DataTypes.UUID,
      allowNull: true,
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
    },
    vehicle_type_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    transmission_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    ipUsuarioOperacion: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    idUsuarioOperacion: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    clientAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tipoOperacion: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    createdAt: true,
    updatedAt: false,
    tableName: "log_vehicles",
    freezeTableName: true,
    schema: config.schemaTwo,
  }
);

module.exports = LogVehicles;
