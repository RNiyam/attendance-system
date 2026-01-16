const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const otpController = require('../controllers/otpController');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const sendOtpValidation = [
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .isLength({ min: 10, max: 10 })
    .withMessage('Mobile number must be 10 digits')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile number must contain only digits')
];

const verifyOtpValidation = [
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .isLength({ min: 10, max: 10 })
    .withMessage('Mobile number must be 10 digits')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile number must contain only digits'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 4, max: 4 })
    .withMessage('OTP must be 4 digits')
    .matches(/^[0-9]{4}$/)
    .withMessage('OTP must contain only digits')
];

router.post('/send', sendOtpValidation, validateRequest, otpController.sendOtp);
router.post('/verify', verifyOtpValidation, validateRequest, otpController.verifyOtp);

module.exports = router;
