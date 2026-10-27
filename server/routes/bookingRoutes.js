import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  demoPayment,
  verifyBookingReference,
  getExtensionQuote,
  extendBooking,
} from '../controllers/bookingController.js';
import {
  validateBookingCreate,
  validateBookingCancel,
  validateDemoPayment,
  validateExtensionQuote,
  validateBookingExtend,
} from '../validators/bookingValidators.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public QR/reference verification endpoint
router.get('/verify/:reference', verifyBookingReference);

// Authenticated user booking routes
router.post('/', authenticate, validateBookingCreate, createBooking);
router.get('/my', authenticate, getMyBookings);
router.get('/:id', authenticate, getBookingById);
router.get('/:id/extension-quote', authenticate, validateExtensionQuote, getExtensionQuote);
router.post('/:id/extend', authenticate, validateBookingExtend, extendBooking);
router.patch('/:id/cancel', authenticate, validateBookingCancel, cancelBooking);
router.post('/:id/demo-payment', authenticate, validateDemoPayment, demoPayment);

export default router;
