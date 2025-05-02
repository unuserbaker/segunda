const config = require("../config/index");
const { Sequelize } = require("sequelize");

/** */
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    // timezone: config.tz,
    host: config.host,
    dialect: config.dialect,
    define: {
      charset: "utf-8",
      collate: "utf8_general_ci",
    },
    logging: false,
    dialectOptions: config.dialectOptions,
    /* The `pool` configuration option in Sequelize is used to manage the connection pool for the
    database. */
    pool: {
      max: 30,
      min: 0,
      acquire: 20000,
      idle: 20000,
      evict: 10000,
    },
  }
);

module.exports = sequelize;
