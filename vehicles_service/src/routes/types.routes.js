const { Router } = require("express");
const vehicleTypesController = require("#C/types.controller");

const router = Router();

router.get("/", vehicleTypesController.list);

module.exports = router;
