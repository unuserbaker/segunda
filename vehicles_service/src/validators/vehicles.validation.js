const { body, validationResult } = require('express-validator');

const createVehicleValidation = [
  body('brand_id').isInt().withMessage('brand_id debe ser un número entero'),
  body('price').isFloat({ gt: 0 }).withMessage('price debe ser un número positivo'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('mileage debe ser un número entero positivo'),
  body('vehicle_type_id').isInt().withMessage('vehicle_type_id es requerido'),
  body('vehicle_type_id').isInt().withMessage('vehicle_type_id es requerido'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  createVehicleValidation,
};