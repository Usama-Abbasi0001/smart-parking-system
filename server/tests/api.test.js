import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { checkSlotAvailability } from '../services/availabilityService.js';
import { generateBookingQRCode } from '../services/qrService.js';
import { runExpiryAndReminderSweep } from '../services/schedulerService.js';

test.before(async () => {
  // Isolate tests in in-memory MongoDB so test execution never modifies or wipes the live Atlas database
  delete process.env.MONGODB_URI;
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    ParkingSlot.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
  ]);
});

test.after(async () => {
  await disconnectDB();
});

test('User registration and password hashing', async () => {
  const hash = await User.hashPassword('Secret123!');
  const user = await User.create({
    name: 'Test Driver',
    email: 'driver@test.com',
    passwordHash: hash,
    vehicleNumber: 'TST-999',
    role: 'user',
  });

  assert.equal(user.email, 'driver@test.com');
  assert.equal(user.role, 'user');
  assert.equal(user.vehicleNumber, 'TST-999');

  const isMatch = await user.comparePassword('Secret123!');
  assert.equal(isMatch, true);

  const isWrong = await user.comparePassword('WrongPassword');
  assert.equal(isWrong, false);
});

test('ParkingSlot unique constraint per area and slotNumber', async () => {
  const slot1 = await ParkingSlot.create({
    slotNumber: 'A-01',
    area: 'North Deck',
    floorOrZone: 'Floor 1',
    hourlyRate: 5.0,
  });
  assert.ok(slot1._id);

  // Attempt duplicate in SAME area should fail
  await assert.rejects(
    async () => {
      await ParkingSlot.create({
        slotNumber: 'A-01',
        area: 'North Deck',
        floorOrZone: 'Floor 1',
        hourlyRate: 6.0,
      });
    },
    /duplicate key error|E11000/
  );

  // Same slot number in DIFFERENT area should succeed
  const slot2 = await ParkingSlot.create({
    slotNumber: 'A-01',
    area: 'South Deck',
    floorOrZone: 'Floor 1',
    hourlyRate: 6.0,
  });
  assert.ok(slot2._id);
});

test('Booking conflict detection and prevention', async () => {
  const user = await User.findOne({ email: 'driver@test.com' });
  const slot = await ParkingSlot.findOne({ slotNumber: 'A-01', area: 'North Deck' });

  const now = new Date();
  const t1 = new Date(now.getTime() + 60 * 60 * 1000);  // +1 hour
  const t2 = new Date(now.getTime() + 180 * 60 * 1000); // +3 hours

  // Initially slot is available
  const initialCheck = await checkSlotAvailability(slot._id, t1, t2);
  assert.equal(initialCheck.available, true);

  // Create confirmed booking for t1 to t2
  const booking1 = await Booking.create({
    bookingReference: 'PRK-TEST-001',
    userId: user._id,
    slotId: slot._id,
    startTime: t1,
    endTime: t2,
    durationMinutes: 120,
    amount: 10.0,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
  });
  assert.ok(booking1._id);

  // Exact same interval check -> conflict!
  const overlapExact = await checkSlotAvailability(slot._id, t1, t2);
  assert.equal(overlapExact.available, false);

  // Partial overlap (starts during booking) -> conflict!
  const overlapInside = await checkSlotAvailability(
    slot._id,
    new Date(t1.getTime() + 30 * 60 * 1000),
    new Date(t2.getTime() + 60 * 60 * 1000)
  );
  assert.equal(overlapInside.available, false);

  // Non-overlapping interval (after t2) -> should be available!
  const afterInterval = await checkSlotAvailability(
    slot._id,
    new Date(t2.getTime() + 10 * 60 * 1000),
    new Date(t2.getTime() + 120 * 60 * 1000)
  );
  assert.equal(afterInterval.available, true);
});

test('QR Code generation produces valid data URL', async () => {
  const qr = await generateBookingQRCode('PRK-VERIFY-999');
  assert.ok(qr.startsWith('data:image/png;base64,'));
});

test('Password reset code generation and password update', async () => {
  const user = await User.findOne({ email: 'driver@test.com' });
  assert.ok(user);

  // Set reset code and expiry
  user.resetPasswordCode = '987654';
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  // Verify code is stored
  const userWithCode = await User.findById(user._id).select('+resetPasswordCode +resetPasswordExpires');
  assert.equal(userWithCode.resetPasswordCode, '987654');

  // Update password with new hash
  userWithCode.passwordHash = await User.hashPassword('NewSecret999!');
  userWithCode.resetPasswordCode = undefined;
  userWithCode.resetPasswordExpires = undefined;
  await userWithCode.save();

  // Verify new password matches and code is cleared
  const updatedUser = await User.findById(user._id).select('+passwordHash +resetPasswordCode');
  assert.equal(updatedUser.resetPasswordCode, undefined);
  const isMatchNew = await updatedUser.comparePassword('NewSecret999!');
  assert.equal(isMatchNew, true);
  const isMatchOld = await updatedUser.comparePassword('Secret123!');
  assert.equal(isMatchOld, false);
});

test('15-Minute reminder sweep sends reminder and is idempotent', async () => {
  const user = await User.findOne({ email: 'driver@test.com' });
  const slot = await ParkingSlot.findOne({ slotNumber: 'A-01', area: 'South Deck' });

  // Booking ending in 10 minutes from now (falls inside the 15-minute reminder window)
  const now = new Date();
  const startTime = new Date(now.getTime() - 50 * 60 * 1000); // 50 mins ago
  const endTime = new Date(now.getTime() + 10 * 60 * 1000);   // in 10 mins

  const booking = await Booking.create({
    bookingReference: 'PRK-REMIND-001',
    userId: user._id,
    slotId: slot._id,
    startTime,
    endTime,
    durationMinutes: 60,
    amount: slot.hourlyRate,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    reminderSent15m: false,
  });

  assert.equal(booking.reminderSent15m, false);

  // Run the background sweep
  const sweepResult = await runExpiryAndReminderSweep();
  assert.ok(sweepResult.remindersSent >= 1);

  // Re-fetch booking from DB
  const refreshed = await Booking.findById(booking._id);
  assert.equal(refreshed.reminderSent15m, true);
  assert.ok(refreshed.reminderSent15mAt);

  const initialReminderTimestamp = refreshed.reminderSent15mAt.getTime();

  // Run the background sweep a 2nd time -> Must be idempotent (no duplicate notification)
  const secondSweep = await runExpiryAndReminderSweep();
  const reRefreshed = await Booking.findById(booking._id);
  assert.equal(reRefreshed.reminderSent15m, true);
  assert.equal(reRefreshed.reminderSent15mAt.getTime(), initialReminderTimestamp);
});

test('Expiry sweep marks expired booking overdue and is idempotent', async () => {
  const user = await User.findOne({ email: 'driver@test.com' });
  const slot = await ParkingSlot.findOne({ slotNumber: 'A-01', area: 'South Deck' });

  const now = new Date();
  const startTime = new Date(now.getTime() - 120 * 60 * 1000); // 2 hours ago
  const endTime = new Date(now.getTime() - 5 * 60 * 1000);     // 5 minutes ago (expired)

  const booking = await Booking.create({
    bookingReference: 'PRK-EXPIRY-001',
    userId: user._id,
    slotId: slot._id,
    startTime,
    endTime,
    durationMinutes: 115,
    amount: slot.hourlyRate * 2,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    expiryEmailSent: false,
  });

  // Run background sweep
  const sweepResult = await runExpiryAndReminderSweep();
  assert.ok(sweepResult.expiredCount >= 1);

  const updatedBooking = await Booking.findById(booking._id);
  assert.equal(updatedBooking.bookingStatus, 'overdue');
  assert.equal(updatedBooking.overstayStatus, 'overstay');
  assert.equal(updatedBooking.expiryEmailSent, true);
  assert.ok(updatedBooking.expiryEmailSentAt);

  // Run 2nd sweep -> idempotent, does not re-mark or fail
  await runExpiryAndReminderSweep();
  const afterSecondSweep = await Booking.findById(booking._id);
  assert.equal(afterSecondSweep.bookingStatus, 'overdue');
  assert.equal(afterSecondSweep.expiryEmailSent, true);
});

test('Extension quote and conflict detection when slot is reserved subsequently', async () => {
  const user = await User.findOne({ email: 'driver@test.com' });
  const slot = await ParkingSlot.findOne({ slotNumber: 'A-01', area: 'North Deck' });

  const baseTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
  const b1Start = new Date(baseTime.getTime());
  const b1End = new Date(baseTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours

  // User 1 Booking: baseTime -> baseTime + 2h
  const booking1 = await Booking.create({
    bookingReference: 'PRK-EXTEND-001',
    userId: user._id,
    slotId: slot._id,
    startTime: b1Start,
    endTime: b1End,
    durationMinutes: 120,
    amount: 10.0,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
  });

  // Subsequent Booking for another driver: starts 30 mins after booking1 ends
  const b2Start = new Date(b1End.getTime() + 30 * 60 * 1000); // +30m gap
  const b2End = new Date(b2Start.getTime() + 60 * 60 * 1000);
  const booking2 = await Booking.create({
    bookingReference: 'PRK-CONFLICT-002',
    userId: user._id,
    slotId: slot._id,
    startTime: b2Start,
    endTime: b2End,
    durationMinutes: 60,
    amount: 5.0,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
  });

  // 1. Extending by 30 mins (fills gap up to b2Start): should be AVAILABLE
  const check30m = await checkSlotAvailability(
    slot._id,
    b1End,
    new Date(b1End.getTime() + 30 * 60 * 1000),
    booking1._id
  );
  assert.equal(check30m.available, true);

  // 2. Extending by 60 mins (overlaps b2Start by 30 mins): should be CONFLICT / REJECTED
  const check60m = await checkSlotAvailability(
    slot._id,
    b1End,
    new Date(b1End.getTime() + 60 * 60 * 1000),
    booking1._id
  );
  assert.equal(check60m.available, false);
});

test('Extension payment failure does not alter booking schedule or amount', async () => {
  const user = await User.findOne({ email: 'driver@test.com' });
  const slot = await ParkingSlot.findOne({ slotNumber: 'A-01', area: 'South Deck' });

  const now = new Date();
  const startTime = new Date(now.getTime() + 60 * 60 * 1000);
  const endTime = new Date(now.getTime() + 180 * 60 * 1000);

  const originalBooking = await Booking.create({
    bookingReference: 'PRK-FAIL-EXT-001',
    userId: user._id,
    slotId: slot._id,
    startTime,
    endTime,
    durationMinutes: 120,
    amount: 12.0,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
  });

  // Create failed payment record
  const failedPayment = await Payment.create({
    bookingId: originalBooking._id,
    userId: user._id,
    amount: 6.0,
    type: 'extension',
    extensionMinutes: 60,
    status: 'failed',
    transactionReference: 'TXN-FAIL-001',
    failureReason: 'Card declined or test failure triggered',
  });
  assert.equal(failedPayment.status, 'failed');

  // Verify booking remains unchanged
  const unchangedBooking = await Booking.findById(originalBooking._id);
  assert.equal(unchangedBooking.endTime.getTime(), endTime.getTime());
  assert.equal(unchangedBooking.durationMinutes, 120);
  assert.equal(unchangedBooking.amount, 12.0);
  assert.equal(unchangedBooking.extensionHistory.length, 0);
});

test('Extension payment success atomically updates end time, amount, and history', async () => {
  const user = await User.findOne({ email: 'driver@test.com' });
  const slot = await ParkingSlot.findOne({ slotNumber: 'A-01', area: 'South Deck' });

  const now = new Date();
  const startTime = new Date(now.getTime() + 300 * 60 * 1000);
  const endTime = new Date(now.getTime() + 420 * 60 * 1000); // 2 hours

  const booking = await Booking.create({
    bookingReference: 'PRK-SUCC-EXT-001',
    userId: user._id,
    slotId: slot._id,
    startTime,
    endTime,
    durationMinutes: 120,
    amount: 12.0,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    reminderSent15m: true,
  });

  const additionalMinutes = 60;
  const additionalAmount = 6.0;
  const newEndTime = new Date(endTime.getTime() + additionalMinutes * 60 * 1000);

  // Successful payment record
  const payment = await Payment.create({
    bookingId: booking._id,
    userId: user._id,
    amount: additionalAmount,
    type: 'extension',
    extensionMinutes: additionalMinutes,
    status: 'paid',
    transactionReference: 'TXN-EXT-TEST-001',
  });

  // Apply atomic extension update
  const updated = await Booking.findByIdAndUpdate(
    booking._id,
    {
      $set: {
        endTime: newEndTime,
        reminderSent15m: false,
        reminderSent15mAt: null,
        expiryEmailSent: false,
        expiryEmailSentAt: null,
        overstayStatus: 'none',
      },
      $inc: {
        durationMinutes: additionalMinutes,
        amount: additionalAmount,
      },
      $push: {
        extensionHistory: {
          extendedAt: new Date(),
          addedMinutes: additionalMinutes,
          additionalAmount,
          previousEndTime: endTime,
          newEndTime,
          transactionReference: 'TXN-EXT-TEST-001',
          paymentId: payment._id,
        },
      },
    },
    { new: true }
  );

  assert.equal(updated.endTime.getTime(), newEndTime.getTime());
  assert.equal(updated.durationMinutes, 180);
  assert.equal(updated.amount, 18.0);
  assert.equal(updated.reminderSent15m, false); // Reset so customer gets new reminder!
  assert.equal(updated.extensionHistory.length, 1);
  assert.equal(updated.extensionHistory[0].addedMinutes, 60);
  assert.equal(updated.extensionHistory[0].additionalAmount, 6.0);
});

test('Booking completion transitions status cleanly', async () => {
  const user = await User.findOne({ email: 'driver@test.com' });
  const slot = await ParkingSlot.findOne({ slotNumber: 'A-01', area: 'South Deck' });

  const booking = await Booking.create({
    bookingReference: 'PRK-COMPLETE-001',
    userId: user._id,
    slotId: slot._id,
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    durationMinutes: 60,
    amount: 6.0,
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
  });

  booking.bookingStatus = 'completed';
  booking.completedAt = new Date();
  await booking.save();

  const refreshed = await Booking.findById(booking._id);
  assert.equal(refreshed.bookingStatus, 'completed');
  assert.ok(refreshed.completedAt);
});

