const { Router } = require("express");
const vehicleTransmissionsController = require("#C/transmissions.controller");

const router = Router();

router.get("/", vehicleTransmissionsController.list);

/**
 * @swagger
 * /transmissions:
 *   get:
 *     summary: Obtiene todos las transmisiones de vehículo
 *     tags:
 *      - transmissions
 *     responses:
 *       200:
 *         description: Lista de transmisiones de vehículo
 */

module.exports = router;
