"use strict";
const vehicle_transmissions = require("../../../jsons/vehicle_transmissions.json");
const config = require("../../config/index");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = vehicle_transmissions.map((vehicle_transmissions) => ({
        ...vehicle_transmissions,
        transmission_id: uuidv4(),
      }));
      await queryInterface.bulkInsert(
        { tableName: "vehicle_transmissions", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed vehicle_transmissions");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "vehicle_transmissions", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
