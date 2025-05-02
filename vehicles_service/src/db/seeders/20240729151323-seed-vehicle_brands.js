"use strict";
const vehicle_brands = require("../../../jsons/vehicle_brands.json");
const config = require("../../config/index");
const { v4: uuidv4 } = require("uuid");


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = vehicle_brands.map((vehicle_brands) => ({
        ...vehicle_brands,
        brand_id: uuidv4(),
      }));
      await queryInterface.bulkInsert(
        { tableName: "vehicle_brands", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed vehicle_brands");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "vehicle_brands", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
