"use strict";
const vehicle_categories = require("../../../jsons/vehicle_categories.json");
const config = require("../../config/index");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = vehicle_categories.map((vehicle_categories) => ({
        ...vehicle_categories,
        category_id: uuidv4(),
      }));
      await queryInterface.bulkInsert(
        { tableName: "vehicle_categories", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed vehicle_categories");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "vehicle_categories", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
