"use strict";
const types = require("../../../jsons/types.json");
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = types.map((types) => ({
        ...types,
      }));
      await queryInterface.bulkInsert(
        { tableName: "types", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed types");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "types", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
