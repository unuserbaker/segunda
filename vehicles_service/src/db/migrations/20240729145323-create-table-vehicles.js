"use strict";
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable(
        {
          name: "vehicles",
          tableName: "vehicles",
          schema: config.schemaOne,
        },
        {
          id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.DataTypes.UUIDV4,
          },
          category_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "categories",
                schema: config.schemaOne,
              },
              key: "id",
            },
            onDelete: "SET NULL",
          },
          brand_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "brands",
                schema: config.schemaOne,
              },
              key: "id",
            },
            onDelete: "SET NULL",
          },
          price: {
            type: Sequelize.DataTypes.DECIMAL(15, 2),
            allowNull: false,
          },
          mileage: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false,
          },
          plate: {
            type: Sequelize.DataTypes.STRING(10),
            allowNull: false,
            unique: true,
          },
          engine_type_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "engine_types",
                schema: config.schemaOne,
              },
              key: "id",
            },
            onDelete: "SET NULL",
          },
          type_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "types",
                schema: config.schemaOne,
              },
              key: "id",
            },
            onDelete: "SET NULL",
          },
          transmission_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "transmissions",
                schema: config.schemaOne,
              },
              key: "id",
            },
            onDelete: "SET NULL",
          },
          seller_id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: true,
          },
          status_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "status",
                schema: config.schemaOne,
              },
              key: "id",
            },
            onDelete: "SET NULL",
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
      console.log("+++++++__S__U__C__C__E__S__S__++++++", "vehicles");
    } catch (error) {
      console.log(
        "E_R_R_O_R createTable MIG:: " + "vehicles" + " message=>",
        error.message
      );
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.dropTable({
        tableName: "vehicles",
        schema: config.schemaOne,
      });
      console.log("+++++++D_R_O_P++++++", "vehicles");
    } catch (error) {
      console.log(
        "error dropTable:: " + "vehicles" + " message==>",
        error.message
      );
    }
  },
};
