"use strict";
const vehicle_status = require("../../../jsons/vehicle_status.json");
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = vehicle_status.map((vehicle_status) => ({
        ...vehicle_status,
      }));
      await queryInterface.bulkInsert(
        { tableName: "vehicle_status", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed vehicle_status");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "vehicle_status", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
