import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate.js';

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('vehicleNumber')
    .trim()
    .notEmpty()
    .withMessage('Vehicle registration number is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Vehicle number must be between 3 and 20 characters')
    .toUpperCase(),
  validateRequest,
];

export const validateLogin = [
  body().custom((value, { req }) => {
    const ident = req.body.identifier || req.body.email || req.body.vehicleNumber;
    if (!ident || typeof ident !== 'string' || !ident.trim()) {
      throw new Error('Vehicle plate number or email address is required');
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  body('vehicleNumber')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Vehicle number must be between 3 and 20 characters')
    .toUpperCase(),
  validateRequest,
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validateRequest,
];

export const validateForgotPassword = [
  body().custom((value, { req }) => {
    const ident = req.body.identifier || req.body.email || req.body.vehicleNumber;
    if (!ident || typeof ident !== 'string' || !ident.trim()) {
      throw new Error('Vehicle plate number or email address is required');
    }
    return true;
  }),
  validateRequest,
];

export const validateResetPassword = [
  body().custom((value, { req }) => {
    const ident = req.body.identifier || req.body.email || req.body.vehicleNumber;
    if (!ident || typeof ident !== 'string' || !ident.trim()) {
      throw new Error('Vehicle plate number or email address is required');
    }
    return true;
  }),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Verification code is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validateRequest,
];

