import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const User = (await import('../models/User.js')).default;
    const ParkingSlot = (await import('../models/ParkingSlot.js')).default;
    const Booking = (await import('../models/Booking.js')).default;

    // 1. Create/Update new Admin: usamakhan58461@gmail.com / 2k22-cs-44
    const adminEmail = 'usamakhan58461@gmail.com';
    const adminPassword = '2k22-cs-44';
    const adminHash = await User.hashPassword(adminPassword);

    let newAdmin = await User.findOne({ email: adminEmail });
    if (!newAdmin) {
      newAdmin = await User.create({
        name: 'Usama Khan',
        email: adminEmail,
        passwordHash: adminHash,
        role: 'admin',
        vehicleNumber: 'ADMIN-001',
        accountStatus: 'active',
      });
      console.log(`✅ Created New Admin: ${adminEmail} (Password: ${adminPassword})`);
    } else {
      newAdmin.passwordHash = adminHash;
      newAdmin.role = 'admin';
      newAdmin.accountStatus = 'active';
      newAdmin.name = 'Usama Khan';
      await newAdmin.save();
      console.log(`✅ Updated Admin Credentials: ${adminEmail}`);
    }

    // 2. Remove old admin: admin@smartpark.com
    const delOldAdmin = await User.deleteMany({ email: 'admin@smartpark.com' });
    console.log(`🗑️ Removed old admin accounts: ${delOldAdmin.deletedCount}`);

    // 3. Prepare Exactly 30 Parking Slots:
    // - 15 Cars @ 2500 PKR/hr (5,000 PKR for 2 hours)
    // - 10 Bikes @ 1250 PKR/hr (2,500 PKR for 2 hours)
    // - 5 Cycles @ 500 PKR/hr (1,000 PKR for 2 hours)
    const newSlotsData = [];

    // 15 Car Slots
    for (let i = 1; i <= 15; i++) {
      const num = String(i).padStart(2, '0');
      newSlotsData.push({
        slotNumber: `CAR-${num}`,
        area: 'Central Plaza - Car Deck',
        floorOrZone: i <= 8 ? 'Floor 1' : 'Floor 2',
        hourlyRate: 2500, // 2h = 5,000 PKR (5k)
        slotType: 'car',
        active: true,
        maintenanceStatus: false,
        description: 'Spacious car bay with automatic ultrasonic sensor (PKR 5,000 for 2 hrs)',
      });
    }

    // 10 Bike Slots
    for (let i = 1; i <= 10; i++) {
      const num = String(i).padStart(2, '0');
      newSlotsData.push({
        slotNumber: `BIKE-${num}`,
        area: 'Metro Station - Bike Zone',
        floorOrZone: 'Ground Bay',
        hourlyRate: 1250, // 2h = 2,500 PKR (2.5k)
        slotType: 'bike',
        active: true,
        maintenanceStatus: false,
        description: 'Motorcycle bay with ground chain lock and HD CCTV (PKR 2,500 for 2 hrs)',
      });
    }

    // 5 Cycle Slots
    for (let i = 1; i <= 5; i++) {
      const num = String(i).padStart(2, '0');
      newSlotsData.push({
        slotNumber: `CYCLE-${num}`,
        area: 'Eco Hub - Cycle Stands',
        floorOrZone: 'Sheltered Stand',
        hourlyRate: 500, // 2h = 1,000 PKR (1k)
        slotType: 'cycle',
        active: true,
        maintenanceStatus: false,
        description: 'Sheltered bicycle stand with frame lock mount (PKR 1,000 for 2 hrs)',
      });
    }

    // Replace old slots with 30 new slots
    await ParkingSlot.deleteMany({});
    const insertedSlots = await ParkingSlot.insertMany(newSlotsData);
    console.log(`✅ Created exactly ${insertedSlots.length} new parking slots.`);

    // 4. Re-link existing bookings to new slots (so no booking is broken)
    const existingBookings = await Booking.find({});
    for (let idx = 0; idx < existingBookings.length; idx++) {
      const b = existingBookings[idx];
      const targetSlot = insertedSlots[idx % insertedSlots.length];
      b.slotId = targetSlot._id;
      // Recalculate amount based on slot rate (e.g. 2h duration)
      const hours = (b.durationMinutes || 120) / 60;
      b.amount = Math.round(hours * targetSlot.hourlyRate);
      await b.save();
    }
    console.log(`✅ Re-linked and updated ${existingBookings.length} bookings to new slots.`);

    // Print summary
    const finalUsers = await User.find({}, 'name email role vehicleNumber');
    const slotCount = await ParkingSlot.countDocuments();
    const carSlots = await ParkingSlot.countDocuments({ slotType: 'car' });
    const bikeSlots = await ParkingSlot.countDocuments({ slotType: 'bike' });
    const cycleSlots = await ParkingSlot.countDocuments({ slotType: 'cycle' });

    console.log('\n--- VERIFICATION REPORT ---');
    console.log('Active Users:', finalUsers);
    console.log(`Total Slots: ${slotCount} (Cars: ${carSlots}, Bikes: ${bikeSlots}, Cycles: ${cycleSlots})`);

    process.exit(0);
  } catch (err) {
    console.error('Error during setup:', err);
    process.exit(1);
  }
};

run();
