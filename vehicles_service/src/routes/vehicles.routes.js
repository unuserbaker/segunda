const { Router } = require("express");
const vehiclesController = require("#C/vehicles.controller");
const { createVehicleValidation, updateVehicleValidation } = require("#V/vehicles.validation");

const router = Router();
router.get("/", vehiclesController.list);
router.post("/", createVehicleValidation, vehiclesController.create);
router.put("/:id", updateVehicleValidation, vehiclesController.update);

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Obtiene todos los vehículos
 *     tags:
 *       - Vehicles
 *     responses:
 *       200:
 *         description: Lista de vehículos
 */

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Crea un nuevo vehículo
 *     tags:
 *       - Vehicles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brand_id
 *               - type_id
 *               - model
 *               - year
 *               - color
 *               - engine_type_id
 *               - status_id
 *             properties:
 *               brand_id:
 *                 type: integer
 *                 example: 1
 *               type_id:
 *                 type: integer
 *                 example: 2
 *               model:
 *                 type: string
 *                 example: "Corolla"
 *               year:
 *                 type: integer
 *                 example: 2022
 *               color:
 *                 type: string
 *                 example: "Rojo"
 *               engine_type_id:
 *                 type: integer
 *                 example: 3
 *               status_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Vehículo creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Vehículo ya existe
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /vehicles:
 *   put:
 *     summary: Obtiene todos los vehículos
 *     tags:
 *       - Vehicles
 *     parameters:
 *       - in: path
 *       name: id
 *       required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand_id:
 *                 type: integer
 *                 example: 1
 *               type_id:
 *                 type: integer
 *                 example: 2
 *               model:
 *                 type: string
 *                 example: "Corolla"
 *               year:
 *                 type: integer
 *                 example: 2022
 *               color:
 *                 type: string
 *                 example: "Rojo"
 *               engine_type_id:
 *                 type: integer
 *                 example: 3
 *               status_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Vehículo creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Vehículo ya existe
 *       500:
 *         description: Error interno del servidor
 */


module.exports = router;
