import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

dotenv.config();

export const seedDatabase = async (shouldDisconnect = true) => {
  try {
    console.log('--- Starting Database Seeder for Smart Parking System (4 Malls) ---');

    // 1. Clear bookings, payments, notifications
    await Promise.all([
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('✅ Cleared all bookings, payments, and notifications.');

    // 2. Ensure Admin and User Accounts
    const adminEmail = process.env.ADMIN_EMAIL || 'usamakhan58461@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '2k22-cs-44';
    const adminName = process.env.ADMIN_NAME || 'Usama Khan';
    const adminVehicle = process.env.ADMIN_VEHICLE || 'ADMIN-001';

    let admin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!admin) {
      const adminHash = await User.hashPassword(adminPassword);
      admin = await User.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        passwordHash: adminHash,
        role: 'admin',
        vehicleNumber: adminVehicle,
        accountStatus: 'active',
      });
      console.log(`✅ Admin Account Created: ${admin.email}`);
    } else {
      console.log(`✅ Admin Account Preserved: ${admin.email}`);
    }

    let user = await User.findOne({ vehicleNumber: 'BMW007' });
    if (!user) {
      const userHash = await User.hashPassword('Huzaifa0001');
      user = await User.create({
        name: 'Huzaifa',
        email: 'huzaifa@gmail.com',
        passwordHash: userHash,
        role: 'user',
        vehicleNumber: 'BMW007',
        accountStatus: 'active',
      });
      console.log(`✅ User Account Created: Huzaifa (BMW007)`);
    } else {
      console.log(`✅ User Account Preserved: Huzaifa (BMW007)`);
    }

    // Remove any demo client users
    await User.deleteMany({
      email: { $nin: [adminEmail.toLowerCase(), 'huzaifa@gmail.com'] },
      vehicleNumber: { $nin: ['ADMIN-001', 'BMW007'] },
    });

    // 3. Insert Exactly 30 Parking Slots across 4 Malls
    const slotsData = [
      // 1. Boulevard Mall (10 Slots: 5 Cars, 3 Bikes, 2 Cycles)
      { slotNumber: 'BLV-C01', area: 'Boulevard Mall', floorOrZone: 'Floor 1', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Spacious car bay with automatic sensor' },
      { slotNumber: 'BLV-C02', area: 'Boulevard Mall', floorOrZone: 'Floor 1', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Near main entrance pedestrian lift' },
      { slotNumber: 'BLV-C03', area: 'Boulevard Mall', floorOrZone: 'Floor 1', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Wide executive car bay' },
      { slotNumber: 'BLV-C04', area: 'Boulevard Mall', floorOrZone: 'Floor 2', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Upper covered deck parking' },
      { slotNumber: 'BLV-C05', area: 'Boulevard Mall', floorOrZone: 'Floor 2', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Upper covered deck parking' },
      { slotNumber: 'BLV-B01', area: 'Boulevard Mall', floorOrZone: 'Ground Bay', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'Motorcycle bay with ground chain lock and CCTV' },
      { slotNumber: 'BLV-B02', area: 'Boulevard Mall', floorOrZone: 'Ground Bay', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'Motorcycle bay with ground chain lock and CCTV' },
      { slotNumber: 'BLV-B03', area: 'Boulevard Mall', floorOrZone: 'Ground Bay', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'Motorcycle bay with ground chain lock and CCTV' },
      { slotNumber: 'BLV-CY01', area: 'Boulevard Mall', floorOrZone: 'Eco Stand', hourlyRate: 500, slotType: 'cycle', active: true, maintenanceStatus: false, description: 'Sheltered bicycle stand with frame lock mount' },
      { slotNumber: 'BLV-CY02', area: 'Boulevard Mall', floorOrZone: 'Eco Stand', hourlyRate: 500, slotType: 'cycle', active: true, maintenanceStatus: false, description: 'Sheltered bicycle stand with frame lock mount' },

      // 2. Abdullah Mall (8 Slots: 4 Cars, 3 Bikes, 1 Cycle)
      { slotNumber: 'ABD-C01', area: 'Abdullah Mall', floorOrZone: 'Level 1', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Prime covered car bay near escalators' },
      { slotNumber: 'ABD-C02', area: 'Abdullah Mall', floorOrZone: 'Level 1', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Prime covered car bay near escalators' },
      { slotNumber: 'ABD-C03', area: 'Abdullah Mall', floorOrZone: 'Level 2', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Rooftop shaded car parking' },
      { slotNumber: 'ABD-C04', area: 'Abdullah Mall', floorOrZone: 'Level 2', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Rooftop shaded car parking' },
      { slotNumber: 'ABD-B01', area: 'Abdullah Mall', floorOrZone: 'Ground Floor', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'Covered bike parking bay with security guard' },
      { slotNumber: 'ABD-B02', area: 'Abdullah Mall', floorOrZone: 'Ground Floor', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'Covered bike parking bay with security guard' },
      { slotNumber: 'ABD-B03', area: 'Abdullah Mall', floorOrZone: 'Ground Floor', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'Covered bike parking bay with security guard' },
      { slotNumber: 'ABD-CY01', area: 'Abdullah Mall', floorOrZone: 'Gate 1 Stand', hourlyRate: 500, slotType: 'cycle', active: true, maintenanceStatus: false, description: 'Dual-lock cycle stand near Gate 1' },

      // 3. Chase Value (6 Slots: 3 Cars, 2 Bikes, 1 Cycle)
      { slotNumber: 'CHV-C01', area: 'Chase Value', floorOrZone: 'Basement 1', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Basement car bay with quick shopping cart access' },
      { slotNumber: 'CHV-C02', area: 'Chase Value', floorOrZone: 'Basement 1', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Basement car bay with quick shopping cart access' },
      { slotNumber: 'CHV-C03', area: 'Chase Value', floorOrZone: 'Basement 1', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Basement car bay with quick shopping cart access' },
      { slotNumber: 'CHV-B01', area: 'Chase Value', floorOrZone: 'East Bay', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'East wing motorcycle parking' },
      { slotNumber: 'CHV-B02', area: 'Chase Value', floorOrZone: 'East Bay', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'East wing motorcycle parking' },
      { slotNumber: 'CHV-CY01', area: 'Chase Value', floorOrZone: 'Front Stand', hourlyRate: 500, slotType: 'cycle', active: true, maintenanceStatus: false, description: 'Front sidewalk cycle parking bar' },

      // 4. Mehran Walk (6 Slots: 3 Cars, 2 Bikes, 1 Cycle)
      { slotNumber: 'MHR-C01', area: 'Mehran Walk', floorOrZone: 'Open Plaza', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Open-air secure car parking' },
      { slotNumber: 'MHR-C02', area: 'Mehran Walk', floorOrZone: 'Open Plaza', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Open-air secure car parking' },
      { slotNumber: 'MHR-C03', area: 'Mehran Walk', floorOrZone: 'Open Plaza', hourlyRate: 2500, slotType: 'car', active: true, maintenanceStatus: false, description: 'Open-air secure car parking' },
      { slotNumber: 'MHR-B01', area: 'Mehran Walk', floorOrZone: 'West Bay', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'Two-wheeler bay near promenade' },
      { slotNumber: 'MHR-B02', area: 'Mehran Walk', floorOrZone: 'West Bay', hourlyRate: 1250, slotType: 'bike', active: true, maintenanceStatus: false, description: 'Two-wheeler bay near promenade' },
      { slotNumber: 'MHR-CY01', area: 'Mehran Walk', floorOrZone: 'Walkway Stand', hourlyRate: 500, slotType: 'cycle', active: true, maintenanceStatus: false, description: 'Pedestrian promenade bicycle mount' },
    ];

    await ParkingSlot.deleteMany({});
    const slots = await ParkingSlot.insertMany(slotsData);
    console.log(`✅ Exactly ${slots.length} Parking Slots Created across 4 Malls.`);

    console.log('\n======================================================');
    console.log('🌱 SEEDING COMPLETE! Preserved Real Accounts:');
    console.log(`   Admin:  ${adminEmail}  | Password: ${adminPassword}`);
    console.log(`   User:   Huzaifa (BMW007)       | Password: Huzaifa0001`);
    console.log('   All Demo Bookings Cleared!');
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
