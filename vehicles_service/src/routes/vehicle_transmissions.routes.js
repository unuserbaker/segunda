const { Router } = require("express");
const vehicleTransmissionsController = require("#C/vehicle_transmissions.controller");

const router = Router();

router.get("/", vehicleTransmissionsController.list);

module.exports = router;
