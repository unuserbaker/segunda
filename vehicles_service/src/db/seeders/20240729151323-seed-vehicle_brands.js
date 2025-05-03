"use strict";
const brands = require("../../../jsons/brands.json");
const config = require("../../config/index");


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = brands.map((brands) => ({
        ...brands,
      }));
      await queryInterface.bulkInsert(
        { tableName: "brands", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed brands");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "brands", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
