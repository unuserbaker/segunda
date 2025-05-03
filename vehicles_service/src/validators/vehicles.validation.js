const { body, validationResult } = require('express-validator');

const createVehicleValidation = [
  body('categoryId').isInt().withMessage('categoryId debe ser un número entero'),
  body('brandId').isInt().withMessage('brandId debe ser un número entero'),
  body('price').isFloat({ gt: 0 }).withMessage('price debe ser un número positivo'),
  body('mileage').isInt({ min: 0 }).withMessage('mileage debe ser un número entero positivo'),
  body('plate').isString().matches(/^[A-Z0-9]{1,10}$/).withMessage('plate debe ser una cadena de texto'),
  body('engineTypeId').isInt().withMessage('engineTypeId es requerido'),
  body('typeId').isInt().withMessage('typeId es requerido'),
  body('transmissionId').isInt().withMessage('transmissionId es requerido'),
  body('sellerId').isUUID().optional().withMessage('sellerId debe ser un uuid válido'),
  body('statusId').isInt().withMessage('statusId es requerido'),
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