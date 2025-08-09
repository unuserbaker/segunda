/* eslint-disable no-undef */
const { config } = require("dotenv");

config();
const env = process.env.NODE_ENV;
config({ path: `.env.${env}`, override: true });

const Config = {
  https: process.env.HTTPS === "true",
  portApp: process.env.PORT_APP,
  /**Db */
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.PGPASSWORD,
  tz: process.env.TZ,
  schemaOne: process.env.DB_SCHEMA_ONE,
  schemaTwo: process.env.DB_SCHEMA_TWO,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  env,
};

module.exports = Config;
