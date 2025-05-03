const { Router } = require("express");
const vehicleBrandsController = require("#C/brands.controller");

const router = Router();

router.get("/", vehicleBrandsController.list);

module.exports = router;
