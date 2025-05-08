const { Router } = require("express");
const statusController = require("#C/status.controller");

const router = Router();

router.get("/", statusController.list);

module.exports = router;
