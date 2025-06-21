const { Router } = require("express");
const engineTypesController = require("#C/engine_types.controller");

const router = Router();

router.get("/", engineTypesController.list);

/**
 * @swagger
 * /engine_types:
 *   get:
 *     summary: Obtiene todos los tipos de ingenieria de vehículo
 *     tags:
 *      - engine_types
 *     responses:
 *       200:
 *         description: Lista de tipos de ingenieria de vehículo
 */

module.exports = router;
