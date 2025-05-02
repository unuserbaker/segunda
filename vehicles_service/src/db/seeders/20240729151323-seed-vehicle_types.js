"use strict";
const vehicle_types = require("../../../jsons/vehicle_types.json");
const config = require("../../config/index");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = vehicle_types.map((vehicle_types) => ({
        ...vehicle_types,
        vehicle_type_id: uuidv4(),
      }));
      await queryInterface.bulkInsert(
        { tableName: "vehicle_types", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed vehicle_types");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "vehicle_types", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
