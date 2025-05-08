const express = require("express");
const { indexRoutes } = require("./_barrel");

const routerApi = (app) => {
  const router = express.Router();

  // Privadas
  app.use("/engine_types", indexRoutes.engineTypesRouter);
  app.use("/brands", indexRoutes.brandsRouter);
  app.use("/categories", indexRoutes.categoriesRouter);
  app.use("/transmissions", indexRoutes.transmissionsRouter);
  app.use("/types", indexRoutes.typesRouter);
  app.use("/status", indexRoutes.statusRouter);
  app.use("/vehicles", indexRoutes.vehiclesRouter);
};
module.exports = routerApi;
