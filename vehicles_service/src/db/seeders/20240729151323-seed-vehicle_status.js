"use strict";
const status = require("../../../jsons/status.json");
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = status.map((status) => ({
        ...status,
      }));
      await queryInterface.bulkInsert(
        { tableName: "status", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed status");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "status", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
