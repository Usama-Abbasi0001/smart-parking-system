import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

dotenv.config();

const cleanAndSetup = async () => {
  try {
    await connectDB();
    console.log('--- Cleaning Demo Data & Setting Up 4 Malls (30 Slots) ---');

    // 1. Remove all bookings, payments, and notifications
    const bRes = await Booking.deleteMany({});
    const pRes = await Payment.deleteMany({});
    const nRes = await Notification.deleteMany({});
    console.log(`✅ Removed ${bRes.deletedCount} demo bookings, ${pRes.deletedCount} payments, ${nRes.deletedCount} notifications.`);

    // 2. Remove demo users, keeping only Usama Khan and Huzaifa
    const uRes = await User.deleteMany({
      email: { $nin: ['usamakhan58461@gmail.com', 'huzaifa@gmail.com'] },
      vehicleNumber: { $nin: ['ADMIN-001', 'BMW007'] },
    });
    console.log(`✅ Removed ${uRes.deletedCount} demo users.`);

    // Verify existing users
    const currentUsers = await User.find({}, 'name email role vehicleNumber');
    console.log('✅ Active users preserved:', currentUsers);

    // 3. Insert 30 Slots across the 4 Malls
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
    const inserted = await ParkingSlot.insertMany(slotsData);
    console.log(`✅ Successfully inserted ${inserted.length} slots across 4 Malls:`);

    const distinctAreas = await ParkingSlot.distinct('area');
    console.log('✅ Active Areas:', distinctAreas);

    await disconnectDB();
    console.log('✅ Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

cleanAndSetup();
