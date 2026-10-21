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

test.before(async () => {
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
