import { body, query } from 'express-validator';
import { validateRequest } from '../middleware/validate.js';

export const validateBookingCreate = [
  body('slotId')
    .notEmpty()
    .withMessage('Slot ID is required')
    .isMongoId()
    .withMessage('Invalid slot ID format'),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO8601 date string')
    .custom((value) => {
      const start = new Date(value);
      const now = new Date();
      // Allow 2 minutes grace period for clock skew
      if (start.getTime() < now.getTime() - 2 * 60 * 1000) {
        throw new Error('Start time cannot be in the past');
      }
      return true;
    }),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO8601 date string')
    .custom((value, { req }) => {
      const start = new Date(req.body.startTime);
      const end = new Date(value);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid start or end time');
      }
      if (end.getTime() <= start.getTime()) {
        throw new Error('End time must be strictly after start time');
      }
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        throw new Error('Booking duration must be at least 15 minutes');
      }
      if (durationMinutes > 7 * 24 * 60) {
        throw new Error('Booking duration cannot exceed 7 days');
      }
      return true;
    }),
  body('vehicleNumber')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Vehicle number must be between 3 and 20 characters')
    .toUpperCase(),
  validateRequest,
];

export const validateBookingCancel = [
  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Cancellation reason cannot exceed 250 characters'),
  validateRequest,
];

export const validateDemoPayment = [
  body('outcome')
    .optional()
    .isIn(['success', 'failure'])
    .withMessage('Outcome must be either "success" or "failure"'),
  body('method')
    .optional()
    .isIn(['credit_card', 'debit_card', 'digital_wallet', 'simulated_instant'])
    .withMessage('Invalid payment method'),
  validateRequest,
];

export const validateExtensionQuote = [
  query('minutes')
    .optional()
    .isInt({ min: 15, max: 1440 })
    .withMessage('Extension minutes must be an integer between 15 and 1440'),
  validateRequest,
];

export const validateBookingExtend = [
  body('additionalMinutes')
    .notEmpty()
    .withMessage('Additional extension duration is required')
    .isInt({ min: 15, max: 1440 })
    .withMessage('Additional minutes must be between 15 and 1440'),
  body('method')
    .optional()
    .isIn(['credit_card', 'debit_card', 'digital_wallet', 'simulated_instant'])
    .withMessage('Invalid payment method'),
  body('outcome')
    .optional()
    .isIn(['success', 'failure'])
    .withMessage('Outcome must be either "success" or "failure"'),
  validateRequest,
];

