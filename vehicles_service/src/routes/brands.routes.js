const { Router } = require("express");
const vehicleBrandsController = require("#C/brands.controller");

const router = Router();

router.get("/", vehicleBrandsController.list);

/**
 * @swagger
 * /brands:
 *   get:
 *     summary: Obtiene todos las marcas de vehículo
 *     tags:
 *       - brands
 *     responses:
 *       200:
 *         description: Lista de marcas de vehículo
 */

module.exports = router;
