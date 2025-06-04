const { body, validationResult } = require('express-validator');

const validateOTPRequest = [
  body('mobile')
    .matches(/^\d{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }
    next();
  }
];

const validateVerifyRequest = [
  body('mobile')
    .matches(/^\d{10}$/)
    .withMessage('Please provide a valid 10-digit mobile number'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateOTPRequest,
  validateVerifyRequest
};