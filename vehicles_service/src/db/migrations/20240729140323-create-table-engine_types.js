"use strict";
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable(
        { name: "engine_types", tableName: "engine_types", schema: config.schemaOne },
        {
          engine_type_id: {
            type: Sequelize.Sequelize.DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.Sequelize.DataTypes.UUIDV4,
          },
          name: {
            type: Sequelize.Sequelize.DataTypes.STRING(60),
            allowNull: false,
          },
          strCode: {
            type: Sequelize.Sequelize.DataTypes.STRING(50),
            allowNull: false,
          },
          activo: {
            type: Sequelize.Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          createdAt: {
            type: Sequelize.Sequelize.Sequelize.DataTypes.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            field: "createdAt",
          },
          updatedAt: {
            type: Sequelize.Sequelize.Sequelize.DataTypes.DATE,
            allowNull: true,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
            field: "updatedAt",
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
