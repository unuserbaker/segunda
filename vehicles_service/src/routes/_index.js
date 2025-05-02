const express = require("express");
const { indexRoutes } = require("./_barrel");

const routerApi = (app) => {
  const router = express.Router();

  // Privadas
  app.use("/engine_types", indexRoutes.engineTypesRouter);
  app.use("/vehicle_brands", indexRoutes.vehicleBrandsRouter);
  app.use("/vehicle_categories", indexRoutes.vehicleCategoriesRouter);
  app.use("/vehicle_transmissions", indexRoutes.vehicleTransmissionsRouter);
  app.use("/vehicle_types", indexRoutes.vehicleTypesRouter);
  app.use("/vehicles", indexRoutes.vehiclesRouter);
};
module.exports = routerApi;
