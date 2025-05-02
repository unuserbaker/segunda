const { Router } = require("express");
const engineTypesController = require("#C/engine_types.controller");

const router = Router();

router.get("/", engineTypesController.list);

module.exports = router;
