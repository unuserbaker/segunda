"use strict";
const engine_types = require("../../../jsons/engine_types.json");
const config = require("../../config/index");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = engine_types.map((engine_types) => ({
        ...engine_types,
        engine_type_id: uuidv4(),
      }));
      await queryInterface.bulkInsert(
        { tableName: "engine_types", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed engine_types");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "engine_types", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
