"use strict";
const categories = require("../../../jsons/categories.json");
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = categories.map((categories) => ({
        ...categories,
      }));
      await queryInterface.bulkInsert(
        { tableName: "categories", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed categories");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "categories", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
