const engineTypesRouter = require("./engine_types.routes");
const vehicleBrandsRouter = require("./brands.routes");
const vehicleCategoriesRouter = require("./categories.routes");
const vehicleTransmissionsRouter = require("./transmissions.routes");
const vehicleTypesRouter = require("./types.routes");
const vehiclesRouter = require("./vehicles.routes");

exports.indexRoutes = {
  engineTypesRouter,
  vehicleBrandsRouter,
  vehicleCategoriesRouter,
  vehicleTransmissionsRouter,
  vehicleTypesRouter,
  vehiclesRouter,
};
