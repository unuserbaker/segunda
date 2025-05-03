const express = require("express");
const { indexRoutes } = require("./_barrel");

const routerApi = (app) => {
  const router = express.Router();

  // Privadas
  app.use("/engine_types", indexRoutes.engineTypesRouter);
  app.use("/brands", indexRoutes.vehicleBrandsRouter);
  app.use("/categories", indexRoutes.vehicleCategoriesRouter);
  app.use("/transmissions", indexRoutes.vehicleTransmissionsRouter);
  app.use("/types", indexRoutes.vehicleTypesRouter);
  app.use("/vehicles", indexRoutes.vehiclesRouter);
};
module.exports = routerApi;
