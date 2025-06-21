const { Router } = require("express");
const statusController = require("#C/status.controller");

const router = Router();

router.get("/", statusController.list);

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Obtiene todos los estados de vehículo
 *     tags:
 *      - status
 *     responses:
 *       200:
 *         description: Lista de estados de vehículo
 */


module.exports = router;
