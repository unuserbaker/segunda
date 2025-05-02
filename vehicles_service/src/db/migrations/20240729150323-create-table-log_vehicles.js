"use strict";

const { getColumsSaredLogs } = require("#H/functions");
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable(
        {
          name: "log_vehicles",
          tableName: "log_vehicles",
          schema: config.schemaTwo,
        },
        {
          category_id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: true,
          },
          brand_id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: true,
          },
          price: {
            type: Sequelize.DataTypes.DECIMAL(15, 2),
            allowNull: false,
          },
          mileage: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false,
          },
          engine_type_id: {
            type: Sequelize.DataTypes.UUID,
          },
          vehicle_type_id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: true,
          },
          transmission_id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: true,
          },
          seller_id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: true,
          },
          ...getColumsSaredLogs(Sequelize),
        }
      );
      console.log("+++++++__S__U__C__C__E__S__S__++++++", "log_vehicles");
    } catch (error) {
      console.log(
        "E_R_R_O_R createTable MIG:: " + "log_vehicles" + " message=>",
        error.message
      );
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.dropTable({
        tableName: "log_vehicles",
        schema: config.schemaTwo,
      });
      console.log("+++++++D_R_O_P++++++", "log_vehicles");
    } catch (error) {
      console.log(
        "error dropTable:: " + "log_vehicles" + " message==>",
        error.message
      );
    }
  },
};
