const config = require("../config/index");

/**iniciar conexion a la db
 * @param sequelize database {sqlz}
 * @param serverApp app express
 */
exports.initApp_Db = async ({ sequelize, serverApp }) => {
  try {
    /**conexion */
    await sequelize.authenticate();
    console.log("autenticado a la db");

    const port = config.portApp;
    const serv = serverApp.listen(port, () =>
      console.log("server run on port", serv.address().port)
    );
  } catch (error) {
    console.log("connection error", error);
  }
};
