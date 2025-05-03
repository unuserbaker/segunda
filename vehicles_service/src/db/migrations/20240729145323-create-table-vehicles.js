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
          vehicle_id: {
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
                tableName: "vehicle_categories",
                schema: config.schemaOne,
              },
              key: "category_id",
            },
            onDelete: "SET NULL",
          },
          brand_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "vehicle_brands",
                schema: config.schemaOne,
              },
              key: "brand_id",
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
          engine_type_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "engine_types",
                schema: config.schemaOne,
              },
              key: "engine_type_id",
            },
            onDelete: "SET NULL",
          },
          vehicle_type_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "vehicle_types",
                schema: config.schemaOne,
              },
              key: "vehicle_type_id",
            },
            onDelete: "SET NULL",
          },
          transmission_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "vehicle_transmissions",
                schema: config.schemaOne,
              },
              key: "transmission_id",
            },
            onDelete: "SET NULL",
          },
          seller_id: {
            type: Sequelize.DataTypes.UUID,
            allowNull: true,
          },
          vehicle_status: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: {
                tableName: "vehicle_status",
                schema: config.schemaOne,
              },
              key: "vehicle_status_id",
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
