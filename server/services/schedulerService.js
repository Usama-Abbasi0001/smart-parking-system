import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import { expireOldPendingBookings } from './availabilityService.js';
import {
  sendExpiryReminderEmail,
  sendBookingExpiredEmail,
} from './emailService.js';

let schedulerInterval = null;

/**
 * Runs a single iteration of expiry sweeps, 15-minute reminders, and overdue notifications
 */
export const runExpiryAndReminderSweep = async () => {
  let remindersSent = 0;
  let expiredCount = 0;

  try {
    const now = new Date();

    // 1. Sweep expired pending_payment holds (>15 minutes old)
    await expireOldPendingBookings();

    // 2. Process 15-minute expiry reminders (idempotent, only bookings not yet reminded)
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    const upcomingExpiringBookings = await Booking.find({
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      reminderSent15m: false,
      endTime: { $gt: now, $lte: fifteenMinutesFromNow },
    })
      .populate('userId', 'name email vehicleNumber')
      .populate('slotId', 'slotNumber area floorOrZone hourlyRate');

    for (const booking of upcomingExpiringBookings) {
      try {
        // Atomic update to prevent race conditions or duplicate emails
        const updated = await Booking.findOneAndUpdate(
          { _id: booking._id, reminderSent15m: false },
          {
            $set: {
              reminderSent15m: true,
              reminderSent15mAt: new Date(),
            },
          },
          { new: true }
        );

        if (!updated) continue; // Already handled by concurrent sweep
        remindersSent++;

        const minutesRemaining = Math.max(
          1,
          Math.round((new Date(booking.endTime).getTime() - now.getTime()) / (1000 * 60))
        );

        const slotNum = booking.slotId?.slotNumber || 'Bay';
        const areaName = booking.slotId?.area || 'Deck';

        // In-app notification
        await Notification.create({
          userId: booking.userId?._id || booking.userId,
          title: `Parking Expiring Soon (${minutesRemaining} mins left)`,
          message: `Your reservation for slot ${slotNum} in ${areaName} ends in ${minutesRemaining} minutes. You can extend online now.`,
          type: 'booking',
          bookingId: booking._id,
        });

        // Email reminder with authenticated extension link
        sendExpiryReminderEmail({
          user: booking.userId,
          booking,
          slot: booking.slotId,
          minutesRemaining,
        }).catch((err) => {
          console.warn('[Scheduler] 15m reminder email dispatch warning:', err.message);
        });
      } catch (itemErr) {
        console.error(`[Scheduler] Error processing 15m reminder for booking ${booking._id}:`, itemErr.message);
      }
    }

    // 3. Process At-Expiry / Overdue Bookings (endTime has passed, not yet sent expiry notification)
    const justExpiredBookings = await Booking.find({
      bookingStatus: { $in: ['confirmed', 'overdue'] },
      paymentStatus: 'paid',
      expiryEmailSent: false,
      endTime: { $lte: now },
    })
      .populate('userId', 'name email vehicleNumber')
      .populate('slotId', 'slotNumber area floorOrZone hourlyRate');

    for (const booking of justExpiredBookings) {
      try {
        // Atomically flag expiry email and mark overstay status
        const updated = await Booking.findOneAndUpdate(
          { _id: booking._id, expiryEmailSent: false },
          {
            $set: {
              expiryEmailSent: true,
              expiryEmailSentAt: new Date(),
              overstayStatus: 'overstay',
              bookingStatus: 'overdue',
            },
          },
          { new: true }
        );

        if (!updated) continue;
        expiredCount++;

        const slotNum = booking.slotId?.slotNumber || 'Bay';

        // In-app notification
        await Notification.create({
          userId: booking.userId?._id || booking.userId,
          title: `Parking Reservation Elapsed`,
          message: `Your reservation for slot ${slotNum} has elapsed. Please extend your parking or proceed to exit.`,
          type: 'booking',
          bookingId: booking._id,
        });

        // Email notification with extension link
        sendBookingExpiredEmail({
          user: booking.userId,
          booking,
          slot: booking.slotId,
        }).catch((err) => {
          console.warn('[Scheduler] Expiry email dispatch warning:', err.message);
        });
      } catch (itemErr) {
        console.error(`[Scheduler] Error processing expiry for booking ${booking._id}:`, itemErr.message);
      }
    }

    return { remindersSent, expiredCount };
  } catch (err) {
    console.error('[Scheduler] Expiry & reminder sweep error:', err.message);
    return { remindersSent: 0, expiredCount: 0 };
  }
};

/**
 * Starts the periodic background worker (every 30 seconds)
 */
export const startScheduler = (intervalMs = 30000) => {
  if (schedulerInterval) return schedulerInterval;

  console.log(`⏱️ [Scheduler] Starting periodic expiry & reminder background worker (${intervalMs / 1000}s interval)...`);
  
  // Run immediately on boot
  runExpiryAndReminderSweep().catch((err) => {
    console.warn('[Scheduler] Initial boot sweep warning:', err.message);
  });

  schedulerInterval = setInterval(() => {
    runExpiryAndReminderSweep().catch((err) => {
      console.warn('[Scheduler] Periodic sweep warning:', err.message);
    });
  }, intervalMs);

  return schedulerInterval;
};

/**
 * Stops the scheduler (for graceful shutdown and unit tests)
 */
export const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Background worker stopped.');
  }
};
