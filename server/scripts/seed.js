import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import { generateBookingQRCode } from '../services/qrService.js';

dotenv.config();

export const seedDatabase = async (shouldDisconnect = true) => {
  try {
    console.log('--- Starting Database Seeder for Smart Parking System ---');

    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      ParkingSlot.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // 1. Create First Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartpark.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';
    const adminVehicle = process.env.ADMIN_VEHICLE || 'ADMIN-001';

    const adminHash = await User.hashPassword(adminPassword);
    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      passwordHash: adminHash,
      role: 'admin',
      vehicleNumber: adminVehicle,
      accountStatus: 'active',
    });
    console.log(`✅ Admin Account Created: ${admin.email} (Password: ${adminPassword})`);

    // 2. Create Demo Normal Users
    const userPasswordHash = await User.hashPassword('User1234!');
    const demoUsers = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        passwordHash: userPasswordHash,
        role: 'user',
        vehicleNumber: 'ABC-1234',
        accountStatus: 'active',
      },
      {
        name: 'Sarah Connor',
        email: 'sarah.connor@example.com',
        passwordHash: userPasswordHash,
        role: 'user',
        vehicleNumber: 'CYBER-2026',
        accountStatus: 'active',
      },
      {
        name: 'Michael Knight',
        email: 'michael.knight@example.com',
        passwordHash: userPasswordHash,
        role: 'user',
        vehicleNumber: 'KITT-3000',
        accountStatus: 'active',
      },
    ]);
    console.log(`✅ ${demoUsers.length} Demo Users Created (Password: User1234!)`);

    // 3. Create Diverse Parking Slots
    const slotsData = [
      // Central Plaza Deck (Floor 1 & Floor 2)
      { slotNumber: 'CP-101', area: 'Central Plaza Deck', floorOrZone: 'Floor 1', hourlyRate: 5.0, slotType: 'standard', active: true, maintenanceStatus: false, description: 'Near main pedestrian exit' },
      { slotNumber: 'CP-102', area: 'Central Plaza Deck', floorOrZone: 'Floor 1', hourlyRate: 5.0, slotType: 'standard', active: true, maintenanceStatus: false, description: 'Wide standard slot' },
      { slotNumber: 'CP-103', area: 'Central Plaza Deck', floorOrZone: 'Floor 1', hourlyRate: 4.0, slotType: 'accessible', active: true, maintenanceStatus: false, description: 'Wide bay near elevator' },
      { slotNumber: 'CP-104', area: 'Central Plaza Deck', floorOrZone: 'Floor 1', hourlyRate: 7.5, slotType: 'ev_charging', active: true, maintenanceStatus: false, description: 'Level 2 EV fast charger' },
      { slotNumber: 'CP-105', area: 'Central Plaza Deck', floorOrZone: 'Floor 1', hourlyRate: 10.0, slotType: 'vip', active: true, maintenanceStatus: false, description: 'Reserved premium executive spot' },
      { slotNumber: 'CP-201', area: 'Central Plaza Deck', floorOrZone: 'Floor 2', hourlyRate: 4.5, slotType: 'standard', active: true, maintenanceStatus: false, description: 'Upper covered deck' },
      { slotNumber: 'CP-202', area: 'Central Plaza Deck', floorOrZone: 'Floor 2', hourlyRate: 4.5, slotType: 'standard', active: true, maintenanceStatus: false, description: 'Upper covered deck' },
      { slotNumber: 'CP-203', area: 'Central Plaza Deck', floorOrZone: 'Floor 2', hourlyRate: 3.5, slotType: 'compact', active: true, maintenanceStatus: false, description: 'Compact cars only' },
      { slotNumber: 'CP-204', area: 'Central Plaza Deck', floorOrZone: 'Floor 2', hourlyRate: 4.5, slotType: 'standard', active: true, maintenanceStatus: true, description: 'Sensor maintenance in progress' },

      // Terminal 1 Airport Express (Zone A & Zone B)
      { slotNumber: 'T1-A01', area: 'Terminal 1 Express', floorOrZone: 'Zone A', hourlyRate: 9.0, slotType: 'vip', active: true, maintenanceStatus: false, description: 'Direct walking link to Terminal 1 check-in' },
      { slotNumber: 'T1-A02', area: 'Terminal 1 Express', floorOrZone: 'Zone A', hourlyRate: 8.0, slotType: 'standard', active: true, maintenanceStatus: false, description: 'Terminal 1 Departures' },
      { slotNumber: 'T1-A03', area: 'Terminal 1 Express', floorOrZone: 'Zone A', hourlyRate: 10.0, slotType: 'ev_charging', active: true, maintenanceStatus: false, description: 'Rapid 50kW EV charging hub' },
      { slotNumber: 'T1-A04', area: 'Terminal 1 Express', floorOrZone: 'Zone A', hourlyRate: 6.5, slotType: 'accessible', active: true, maintenanceStatus: false, description: 'Wheelchair access ramp' },
      { slotNumber: 'T1-B01', area: 'Terminal 1 Express', floorOrZone: 'Zone B', hourlyRate: 7.0, slotType: 'standard', active: true, maintenanceStatus: false, description: 'Long-term economy zone' },
      { slotNumber: 'T1-B02', area: 'Terminal 1 Express', floorOrZone: 'Zone B', hourlyRate: 7.0, slotType: 'standard', active: true, maintenanceStatus: false, description: 'Long-term economy zone' },

      // Metro Station Basement B1
      { slotNumber: 'MS-B01', area: 'Metro Station B1', floorOrZone: 'Level -1', hourlyRate: 3.5, slotType: 'compact', active: true, maintenanceStatus: false, description: 'Commuter park & ride' },
      { slotNumber: 'MS-B02', area: 'Metro Station B1', floorOrZone: 'Level -1', hourlyRate: 4.0, slotType: 'standard', active: true, maintenanceStatus: false, description: 'Commuter park & ride' },
      { slotNumber: 'MS-B03', area: 'Metro Station B1', floorOrZone: 'Level -1', hourlyRate: 4.0, slotType: 'standard', active: true, maintenanceStatus: false, description: 'Near subway turnstiles' },
      { slotNumber: 'MS-B04', area: 'Metro Station B1', floorOrZone: 'Level -1', hourlyRate: 6.0, slotType: 'ev_charging', active: true, maintenanceStatus: false, description: 'Subway commuter EV slot' },
      { slotNumber: 'MS-B05', area: 'Metro Station B1', floorOrZone: 'Level -1', hourlyRate: 3.0, slotType: 'standard', active: false, maintenanceStatus: false, description: 'Temporarily deactivated zone' },
    ];

    const slots = await ParkingSlot.insertMany(slotsData);
    console.log(`✅ ${slots.length} Parking Slots Created across 3 Areas`);

    // 4. Create realistic demo bookings and payments
    const now = new Date();
    const primaryUser = demoUsers[0]; // John Doe

    // A. Active booking occupying CP-101 right now
    const activeStart = new Date(now.getTime() - 45 * 60 * 1000); // started 45 mins ago
    const activeEnd = new Date(now.getTime() + 75 * 60 * 1000);   // ends in 1 hour 15 mins
    const activeRef = 'PRK-DEMO-ACT01';
    const qrActive = await generateBookingQRCode(activeRef);

    const activeBooking = await Booking.create({
      bookingReference: activeRef,
      userId: primaryUser._id,
      slotId: slots[0]._id, // CP-101
      startTime: activeStart,
      endTime: activeEnd,
      durationMinutes: 120,
      amount: 10.0,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      vehicleNumber: primaryUser.vehicleNumber,
      qrCodeDataUrl: qrActive,
    });

    await Payment.create({
      bookingId: activeBooking._id,
      userId: primaryUser._id,
      amount: 10.0,
      method: 'credit_card',
      transactionReference: `TXN-SIM-${Date.now()}-A1`,
      status: 'paid',
      simulated: true,
    });

    // B. Upcoming booking tomorrow for Sarah
    const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 180 * 60 * 1000);
    const upRef = 'PRK-DEMO-UP02';
    const qrUp = await generateBookingQRCode(upRef);

    const upcomingBooking = await Booking.create({
      bookingReference: upRef,
      userId: demoUsers[1]._id,
      slotId: slots[3]._id, // CP-104 EV Charging
      startTime: tomorrowStart,
      endTime: tomorrowEnd,
      durationMinutes: 180,
      amount: 22.5,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      vehicleNumber: demoUsers[1].vehicleNumber,
      qrCodeDataUrl: qrUp,
    });

    await Payment.create({
      bookingId: upcomingBooking._id,
      userId: demoUsers[1]._id,
      amount: 22.5,
      method: 'digital_wallet',
      transactionReference: `TXN-SIM-${Date.now()}-U2`,
      status: 'paid',
      simulated: true,
    });

    // C. Past completed booking for John Doe
    const pastStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const pastEnd = new Date(pastStart.getTime() + 120 * 60 * 1000);
    const pastRef = 'PRK-DEMO-CMP03';
    const qrPast = await generateBookingQRCode(pastRef);

    const pastBooking = await Booking.create({
      bookingReference: pastRef,
      userId: primaryUser._id,
      slotId: slots[9]._id, // T1-A01
      startTime: pastStart,
      endTime: pastEnd,
      durationMinutes: 120,
      amount: 18.0,
      bookingStatus: 'completed',
      paymentStatus: 'paid',
      vehicleNumber: primaryUser.vehicleNumber,
      qrCodeDataUrl: qrPast,
      completedAt: pastEnd,
    });

    await Payment.create({
      bookingId: pastBooking._id,
      userId: primaryUser._id,
      amount: 18.0,
      method: 'credit_card',
      transactionReference: `TXN-SIM-${Date.now()}-C3`,
      status: 'paid',
      simulated: true,
    });

    // Notifications for John Doe
    await Notification.insertMany([
      {
        userId: primaryUser._id,
        title: 'Active Parking Session',
        message: 'Your vehicle (ABC-1234) is currently parked at CP-101. Session expires in ~1 hour.',
        type: 'booking',
        bookingId: activeBooking._id,
      },
      {
        userId: primaryUser._id,
        title: 'Payment Confirmation',
        message: 'Simulated payment of $10.00 confirmed for CP-101. Digital receipt is ready.',
        type: 'payment',
        bookingId: activeBooking._id,
      },
    ]);

    console.log('✅ Demo Bookings, Payments, and Notifications Seeded Successfully!');
    console.log('\n======================================================');
    console.log('🌱 SEEDING COMPLETE! Test Credentials:');
    console.log(`   Admin:  ${adminEmail}  | Password: ${adminPassword}`);
    console.log(`   User:   john.doe@example.com   | Password: User1234!`);
    console.log(`   User:   sarah.connor@example.com | Password: User1234!`);
    console.log('======================================================\n');

    if (shouldDisconnect) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seeder Error:', error);
    if (shouldDisconnect) {
      process.exit(1);
    }
  }
};

// If executed directly from command line
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    await connectDB();
    await seedDatabase(true);
  })();
}

