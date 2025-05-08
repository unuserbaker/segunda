const engineTypesRouter = require("./engine_types.routes");
const brandsRouter = require("./brands.routes");
const categoriesRouter = require("./categories.routes");
const transmissionsRouter = require("./transmissions.routes");
const typesRouter = require("./types.routes");
const statusRouter = require("./status.routes");
const vehiclesRouter = require("./vehicles.routes");

exports.indexRoutes = {
  engineTypesRouter,
  brandsRouter,
  categoriesRouter,
  transmissionsRouter,
  typesRouter,
  statusRouter,
  vehiclesRouter,
};
