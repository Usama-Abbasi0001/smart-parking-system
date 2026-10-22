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
    const adminEmail = process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '2k22-cs-44';
    const adminName = process.env.ADMIN_NAME || 'Usama Khan';
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

    // 2. Create Demo Client (Regular User)
    const clientPasswordHash = await User.hashPassword('Client1234!');
    const demoClient = await User.create({
      name: 'Demo Client',
      email: 'client@smartpark.com',
      passwordHash: clientPasswordHash,
      role: 'user',
      vehicleNumber: 'KHI-7860',
      accountStatus: 'active',
    });
    console.log(`✅ Demo Client Created: ${demoClient.email} (Password: Client1234!)`);

    // 3. Create Exactly 30 Parking Slots:
    // 15 Cars @ 2500 PKR/hr (5,000 PKR for 2 hours)
    // 10 Bikes @ 1250 PKR/hr (2,500 PKR for 2 hours)
    // 5 Cycles @ 500 PKR/hr (1,000 PKR for 2 hours)
    const slotsData = [];

    // 15 Car Slots (5k for 2 hours)
    for (let i = 1; i <= 15; i++) {
      const num = String(i).padStart(2, '0');
      slotsData.push({
        slotNumber: `CAR-${num}`,
        area: 'Central Plaza - Car Deck',
        floorOrZone: i <= 8 ? 'Floor 1' : 'Floor 2',
        hourlyRate: 2500,
        slotType: 'car',
        active: true,
        maintenanceStatus: false,
        description: 'Spacious car bay with automatic sensor (PKR 5,000 for 2 hrs)',
      });
    }

    // 10 Bike Slots (2.5k for 2 hours)
    for (let i = 1; i <= 10; i++) {
      const num = String(i).padStart(2, '0');
      slotsData.push({
        slotNumber: `BIKE-${num}`,
        area: 'Metro Station - Bike Zone',
        floorOrZone: 'Ground Bay',
        hourlyRate: 1250,
        slotType: 'bike',
        active: true,
        maintenanceStatus: false,
        description: 'Motorcycle bay with ground chain lock and CCTV (PKR 2,500 for 2 hrs)',
      });
    }

    // 5 Cycle Slots (1k for 2 hours)
    for (let i = 1; i <= 5; i++) {
      const num = String(i).padStart(2, '0');
      slotsData.push({
        slotNumber: `CYCLE-${num}`,
        area: 'Eco Hub - Cycle Stands',
        floorOrZone: 'Sheltered Stand',
        hourlyRate: 500,
        slotType: 'cycle',
        active: true,
        maintenanceStatus: false,
        description: 'Sheltered bicycle stand with frame lock mount (PKR 1,000 for 2 hrs)',
      });
    }

    const slots = await ParkingSlot.insertMany(slotsData);
    console.log(`✅ Exactly ${slots.length} Parking Slots Created (15 Cars, 10 Bikes, 5 Cycles)`);

    // 4. Create realistic demo bookings and payments
    const now = new Date();
    const primaryUser = demoClient;

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
      amount: 300,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      vehicleNumber: primaryUser.vehicleNumber,
      qrCodeDataUrl: qrActive,
    });

    await Payment.create({
      bookingId: activeBooking._id,
      userId: primaryUser._id,
      amount: 300,
      method: 'credit_card',
      transactionReference: `TXN-SIM-${Date.now()}-A1`,
      status: 'paid',
      simulated: true,
    });

    // B. Upcoming booking tomorrow
    const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 180 * 60 * 1000);
    const upRef = 'PRK-DEMO-UP02';
    const qrUp = await generateBookingQRCode(upRef);

    const upcomingBooking = await Booking.create({
      bookingReference: upRef,
      userId: primaryUser._id,
      slotId: slots[3]._id, // CP-104 EV Charging
      startTime: tomorrowStart,
      endTime: tomorrowEnd,
      durationMinutes: 180,
      amount: 600,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      vehicleNumber: primaryUser.vehicleNumber,
      qrCodeDataUrl: qrUp,
    });

    await Payment.create({
      bookingId: upcomingBooking._id,
      userId: primaryUser._id,
      amount: 600,
      method: 'digital_wallet',
      transactionReference: `TXN-SIM-${Date.now()}-U2`,
      status: 'paid',
      simulated: true,
    });

    // C. Past completed booking for Demo Client
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
      amount: 500,
      bookingStatus: 'completed',
      paymentStatus: 'paid',
      vehicleNumber: primaryUser.vehicleNumber,
      qrCodeDataUrl: qrPast,
      completedAt: pastEnd,
    });

    await Payment.create({
      bookingId: pastBooking._id,
      userId: primaryUser._id,
      amount: 500,
      method: 'credit_card',
      transactionReference: `TXN-SIM-${Date.now()}-C3`,
      status: 'paid',
      simulated: true,
    });

    // Notifications for Demo Client
    await Notification.insertMany([
      {
        userId: primaryUser._id,
        title: 'Active Parking Session',
        message: 'Your vehicle (KHI-7860) is currently parked at CP-101. Session expires in ~1 hour.',
        type: 'booking',
        bookingId: activeBooking._id,
      },
      {
        userId: primaryUser._id,
        title: 'Payment Confirmation',
        message: 'Simulated payment of PKR 300 confirmed for CP-101. Digital receipt is ready.',
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

