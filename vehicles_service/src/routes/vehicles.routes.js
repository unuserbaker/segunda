const { Router } = require("express");
const vehiclesController = require("#C/vehicles.controller");

const router = Router();
router.get("/", vehiclesController.list);
router.post("/", vehiclesController.create);
router.put("/:id", vehiclesController.update);

module.exports = router;
