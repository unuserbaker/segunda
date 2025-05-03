"use strict";
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable(
        { name: "vehicle_types", tableName: "vehicle_types", schema: config.schemaOne },
        {
          vehicle_type_id: {
            type: Sequelize.DataTypes.INTEGER,  // Cambiado de UUID a INTEGER
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,  // Agregado autoIncrement para INTEGER
          },
          name: {
            type: Sequelize.DataTypes.STRING(60),
            allowNull: false,
          },
          str_code: {
            type: Sequelize.DataTypes.STRING(50),
            allowNull: false,
          },
          active: {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            field: "created_at",
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
            field: "updated_at",
          },
        }
      );
      console.log("+++++++__S__U__C__C__E__S__S__++++++", "vehicle_types");
    } catch (error) {
      console.log(
        "E_R_R_O_R createTable MIG:: " + "vehicle_types" + " message=>",
        error.message
      );
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.dropTable({
        tableName: "vehicle_types",
        schema: config.schemaOne,
      });
      console.log("+++++++D_R_O_P++++++", "vehicle_types");
    } catch (error) {
      console.log(
        "error dropTable:: " + "vehicle_types" + " message==>",
        error.message
      );
    }
  },
};
