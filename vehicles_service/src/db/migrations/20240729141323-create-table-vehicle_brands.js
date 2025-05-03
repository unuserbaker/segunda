"use strict";
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable(
        {
          name: "brands",
          tableName: "brands",
          schema: config.schemaOne,
        },
        {
          id: {
            type: Sequelize.INTEGER,  // Cambiado de UUID a INTEGER
            allowNull: false,
            primaryKey: true,
            autoIncrement: true, // Agregado autoIncrement para INTEGER
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
      console.log("+++++++__S__U__C__C__E__S__S__++++++", "brands");
    } catch (error) {
      console.log(
        "E_R_R_O_R createTable MIG:: " + "brands" + " message=>",
        error.message
      );
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.dropTable({
        tableName: "brands",
        schema: config.schemaOne,
      });
      console.log("+++++++D_R_O_P++++++", "brands");
    } catch (error) {
      console.log(
        "error dropTable:: " + "brands" + " message==>",
        error.message
      );
    }
  },
};
