const { Router } = require("express");
const vehicleCategoriesController = require("#C/vehicle_categories.controller");

const router = Router();

router.get("/", vehicleCategoriesController.list);

module.exports = router;
