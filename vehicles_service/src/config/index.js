/* eslint-disable no-undef */
const { config } = require("dotenv");
const fs = require("fs");

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
  dialectOptions:
    env !== "local"
      ? {
          statement_timeout: 200000,
          idle_in_transaction_session_timeout: 50000,
          ssl: {
            rejectUnauthorized: false,
            ca: fs.readFileSync(`${process.env.DB_SSL_CA_PATH}`).toString(),
            key: fs.readFileSync(`${process.env.DB_SSL_KEY_PATH}`).toString(),
            cert: fs.readFileSync(`${process.env.DB_SSL_CERT_PATH}`).toString(),
          },
        }
      : undefined,
  ssl_ca_path: process.env.DB_SSL_CA_PATH,
  ssl_key_path: process.env.DB_SSL_KEY_PATH,
  ssl_cert_path: process.env.DB_SSL_CERT_PATH,
  env,
};

module.exports = Config;
