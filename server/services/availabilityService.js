import Booking from '../models/Booking.js';
import ParkingSlot from '../models/ParkingSlot.js';

/**
 * Sweeps and marks expired pending_payment bookings
 */
export const expireOldPendingBookings = async () => {
  const now = new Date();
  await Booking.updateMany(
    {
      bookingStatus: 'pending_payment',
      expiresAt: { $lt: now },
    },
    {
      $set: {
        bookingStatus: 'expired',
        paymentStatus: 'failed',
        cancellationReason: 'Payment window expired (auto-cancelled)',
      },
    }
  );
};

/**
 * Checks if a specific slot is available for the given time window
 * @param {string|ObjectId} slotId
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {string|ObjectId} [excludeBookingId] - Optional booking to exclude (for reschedule/edit)
 * @returns {Promise<{available: boolean, reason?: string, conflictingBooking?: object}>}
 */
export const checkSlotAvailability = async (
  slotId,
  startTime,
  endTime,
  excludeBookingId = null
) => {
  // First ensure expired bookings are swept
  await expireOldPendingBookings();

  const slot = await ParkingSlot.findById(slotId);
  if (!slot) {
    return { available: false, reason: 'Parking slot not found' };
  }

  if (!slot.active) {
    return { available: false, reason: 'This parking slot is currently deactivated' };
  }

  if (slot.maintenanceStatus) {
    return { available: false, reason: 'This parking slot is currently under maintenance' };
  }

  // Conflict query: overlapping intervals where booking is active
  // Condition: startTime < existing.endTime AND endTime > existing.startTime
  const query = {
    slotId,
    bookingStatus: { $in: ['confirmed', 'pending_payment'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(query)
    .populate('userId', 'name vehicleNumber')
    .select('bookingReference startTime endTime bookingStatus userId vehicleNumber');

  if (conflictingBooking) {
    return {
      available: false,
      reason: `Slot is already booked from ${conflictingBooking.startTime.toISOString()} to ${conflictingBooking.endTime.toISOString()}`,
      conflictingBooking,
    };
  }

  return { available: true };
};

/**
 * Computes availability status for all active slots in a given time interval
 */
export const getSlotsWithAvailability = async (
  startTime,
  endTime,
  filter = {},
  sort = { slotNumber: 1 }
) => {
  await expireOldPendingBookings();

  // Find matching slots
  const slots = await ParkingSlot.find(filter).sort(sort).lean();

  if (!startTime || !endTime) {
    // If no time window requested, check current live status (now to +1 hour)
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000);
    return getSlotsWithAvailability(now, defaultEnd, filter, sort);
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Find all conflicting bookings in this window
  const conflictingBookings = await Booking.find({
    bookingStatus: { $in: ['confirmed', 'pending_payment'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  }).select('slotId bookingReference startTime endTime bookingStatus');

  const conflictSlotMap = new Map();
  for (const b of conflictingBookings) {
    conflictSlotMap.set(b.slotId.toString(), b);
  }

  const now = new Date();

  return slots.map((slot) => {
    const conflict = conflictSlotMap.get(slot._id.toString());
    let status = 'available';

    if (!slot.active) {
      status = 'inactive';
    } else if (slot.maintenanceStatus) {
      status = 'maintenance';
    } else if (conflict) {
      if (conflict.bookingStatus === 'pending_payment') {
        status = 'reserved';
      } else {
        // Confirmed booking: is it actively occupying right now?
        if (conflict.startTime <= now && conflict.endTime >= now) {
          status = 'occupied';
        } else {
          status = 'reserved';
        }
      }
    }

    return {
      ...slot,
      isAvailable: status === 'available',
      currentStatus: status,
      conflictingBooking: conflict
        ? {
            reference: conflict.bookingReference,
            startTime: conflict.startTime,
            endTime: conflict.endTime,
            status: conflict.bookingStatus,
          }
        : null,
    };
  });
};
