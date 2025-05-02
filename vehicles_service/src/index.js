const serverApp = require("./app");
const sequelize = require("./db/sequelize");
const { initApp_Db } = require("./libs/initialSetUp");
initApp_Db({ sequelize, serverApp });
