const { body, validationResult } = require('express-validator');

const validateOrder = [
  body('*').optional(),
  body('*.name').optional(),
  body('*.price').optional(),
  body('*.cost').optional(),
  body('*.status').optional(),
  body('*.version').optional(),
  body('*.expenses').optional(),
  body('*.expenses.*.name').optional(),
  body('*.expenses.*.cost').optional(),
  body('*.photos').optional(),
  body('*.photos.*.name').optional(),
  body('*.photos.*.url').optional(),
  body('*.photos.*.type').optional(),
  body('*.customer').optional(),
  body('*.phone').optional(),
  body('*.messenger').optional(),
  body('*.prepayment').optional(),
  body('*.balance').optional(),
  body('*.startDate').optional(),
  body('*.endDate').optional(),
  body('*.duration').optional(),
  body('*.notes').optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateOrder
}; 