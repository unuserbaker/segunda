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
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    brand_id: {
      type: DataTypes.INTEGER,
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
    plate: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    engine_type_id: {
      type: DataTypes.INTEGER,
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    transmission_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    client_agent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    operacion_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    created_at: true,
    updated_at: false,
    tableName: "log_vehicles",
    freezeTableName: true,
    schema: config.schemaTwo,
  }
);

module.exports = LogVehicles;
