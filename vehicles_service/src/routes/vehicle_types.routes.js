const { Router } = require("express");
const vehicleTypesController = require("#C/vehicle_types.controller");

const router = Router();

router.get("/", vehicleTypesController.list);

module.exports = router;
