"use strict";
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable(
        {
          name: "engine_types",
          tableName: "engine_types",
          schema: config.schemaOne,
        },
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
          },
          name: {
            type: Sequelize.STRING(60),
            allowNull: false,
          },
          str_code: {
            type: Sequelize.STRING(50),
            allowNull: false,
          },
          active: {
            type: Sequelize.BOOLEAN,
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
      console.log("+++++++__S__U__C__C__E__S__S__++++++", "engine_types");
    } catch (error) {
      console.log(
        "E_R_R_O_R createTable MIG:: " + "engine_types" + " message=>",
        error.message
      );
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.dropTable({
        tableName: "engine_types",
        schema: config.schemaOne,
      });
      console.log("+++++++D_R_O_P++++++", "engine_types");
    } catch (error) {
      console.log(
        "error dropTable:: " + "engine_types" + " message==>",
        error.message
      );
    }
  },
};
