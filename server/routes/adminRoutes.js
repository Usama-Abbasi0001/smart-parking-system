import express from 'express';
import {
  getAdminStats,
  getAdminReports,
  getAdminSlots,
  createAdminSlot,
  updateAdminSlot,
  toggleAdminSlotStatus,
  getAdminUsers,
  getAdminUserById,
  toggleAdminUserStatus,
  getAdminBookings,
  exportAdminBookingsCSV,
} from '../controllers/adminController.js';
import { cancelBooking } from '../controllers/bookingController.js';
import {
  validateSlotCreate,
  validateSlotUpdate,
} from '../validators/slotValidators.js';
import { validateBookingCancel } from '../validators/bookingValidators.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Enforce authentication and administrative privilege on ALL admin endpoints
router.use(authenticate, requireAdmin);

// Dashboard stats & reports
router.get('/stats', getAdminStats);
router.get('/reports', getAdminReports);

// Slot management
router.get('/slots', getAdminSlots);
router.post('/slots', validateSlotCreate, createAdminSlot);
router.patch('/slots/:id', validateSlotUpdate, updateAdminSlot);
router.patch('/slots/:id/status', toggleAdminSlotStatus);

// User management
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.patch('/users/:id/status', toggleAdminUserStatus);

// Booking management & CSV export
router.get('/bookings', getAdminBookings);
router.get('/bookings/export-csv', exportAdminBookingsCSV);
router.patch('/bookings/:id/cancel', validateBookingCancel, cancelBooking);

export default router;
