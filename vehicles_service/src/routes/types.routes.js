const { Router } = require("express");
const vehicleTypesController = require("#C/types.controller");

const router = Router();

router.get("/", vehicleTypesController.list);

/**
 * @swagger
 * /types:
 *   get:
 *     summary: Obtiene todos los tipos de vehículo
 *     tags:
 *      - types
 *     responses:
 *       200:
 *         description: Lista de tipos de vehículo
 */

module.exports = router;
