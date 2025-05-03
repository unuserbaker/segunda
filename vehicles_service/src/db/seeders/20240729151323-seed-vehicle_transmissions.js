"use strict";
const transmissions = require("../../../jsons/transmissions.json");
const config = require("../../config/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      const data = transmissions.map((transmissions) => ({
        ...transmissions,
      }));
      await queryInterface.bulkInsert(
        { tableName: "transmissions", schema: config.schemaOne },
        data,
        {}
      );
      console.log("success seed transmissions");
    } catch (error) {
      console.log("error::", error.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.bulkDelete(
        { tableName: "transmissions", schema: config.schemaOne },
        {},
        {}
      );
    } catch (error) {
      console.log("error::", error.message);
    }
  },
};
