const engineTypesRouter = require("./engine_types.routes");
const vehicleBrandsRouter = require("./vehicle_brands.routes");
const vehicleCategoriesRouter = require("./vehicle_categories.routes");
const vehicleTransmissionsRouter = require("./vehicle_transmissions.routes");
const vehicleTypesRouter = require("./vehicle_types.routes");
const vehiclesRouter = require("./vehicles.routes");

exports.indexRoutes = {
  engineTypesRouter,
  vehicleBrandsRouter,
  vehicleCategoriesRouter,
  vehicleTransmissionsRouter,
  vehicleTypesRouter,
  vehiclesRouter,
};
