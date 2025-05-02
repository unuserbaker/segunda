"use strict";
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable(
        { name: "vehicle_transmissions", tableName: "vehicle_transmissions", schema: config.schemaOne },
        {
          transmission_id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.DataTypes.UUIDV4,
          },
          name: {
            type: Sequelize.DataTypes.STRING(60),
            allowNull: false,
          },
          strCode: {
            type: Sequelize.DataTypes.STRING(50),
            allowNull: false,
          },
          activo: {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          createdAt: {
            type: Sequelize.Sequelize.DataTypes.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            field: "createdAt",
          },
          updatedAt: {
            type: Sequelize.Sequelize.DataTypes.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
            field: "updatedAt",
          },
        }
      );
      console.log("+++++++__S__U__C__C__E__S__S__++++++", "vehicle_transmissions");
    } catch (error) {
      console.log(
        "E_R_R_O_R createTable MIG:: " + "vehicle_transmissions" + " message=>",
        error.message
      );
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.dropTable({
        tableName: "vehicle_transmissions",
        schema: config.schemaOne,
      });
      console.log("+++++++D_R_O_P++++++", "vehicle_transmissions");
    } catch (error) {
      console.log(
        "error dropTable:: " + "vehicle_transmissions" + " message==>",
        error.message
      );
    }
  },
};
