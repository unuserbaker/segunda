const { Router } = require("express");
const vehiclesController = require("#C/vehicles.controller");
const vehiclesValidator = require("#V/vehicles.validation");

const router = Router();
router.get("/", vehiclesController.list);
router.post("/", vehiclesValidator.create, vehiclesController.create);
router.put("/:id", vehiclesController.update);

module.exports = router;
