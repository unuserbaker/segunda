const { Router } = require("express");
const vehicleCategoriesController = require("#C/categories.controller");

const router = Router();

router.get("/", vehicleCategoriesController.list);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Obtiene todos las categorias de vehículo
 *     tags:
 *       - categories
 *     responses:
 *       200:
 *         description: Lista de categorias de vehículo
 */


module.exports = router;
