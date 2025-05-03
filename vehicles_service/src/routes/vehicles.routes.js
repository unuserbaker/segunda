const { Router } = require("express");
const vehiclesController = require("#C/vehicles.controller");
const { createVehicleValidation } = require("#V/vehicles.validation");

const router = Router();
router.get("/", vehiclesController.list);
router.post("/", createVehicleValidation, vehiclesController.create);
router.put("/:id", vehiclesController.update);

module.exports = router;
