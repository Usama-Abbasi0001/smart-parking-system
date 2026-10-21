import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate.js';

export const validateSlotCreate = [
  body('slotNumber')
    .trim()
    .notEmpty()
    .withMessage('Slot number is required (e.g., A-101)')
    .toUpperCase(),
  body('area')
    .trim()
    .notEmpty()
    .withMessage('Parking area is required'),
  body('floorOrZone')
    .trim()
    .notEmpty()
    .withMessage('Floor or Zone is required'),
  body('hourlyRate')
    .notEmpty()
    .withMessage('Hourly rate is required')
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a non-negative number'),
  body('slotType')
    .optional()
    .isIn(['standard', 'accessible', 'ev_charging', 'compact', 'vip'])
    .withMessage('Invalid slot type'),
  body('description')
    .optional()
    .trim(),
  validateRequest,
];

export const validateSlotUpdate = [
  body('slotNumber')
    .optional()
    .trim()
    .toUpperCase(),
  body('area')
    .optional()
    .trim(),
  body('floorOrZone')
    .optional()
    .trim(),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a non-negative number'),
  body('slotType')
    .optional()
    .isIn(['standard', 'accessible', 'ev_charging', 'compact', 'vip'])
    .withMessage('Invalid slot type'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  body('maintenanceStatus')
    .optional()
    .isBoolean()
    .withMessage('Maintenance status must be a boolean'),
  body('description')
    .optional()
    .trim(),
  validateRequest,
];
