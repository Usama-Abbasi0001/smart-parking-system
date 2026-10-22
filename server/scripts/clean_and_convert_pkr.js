import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const User = (await import('../models/User.js')).default;
    const Booking = (await import('../models/Booking.js')).default;
    const Payment = (await import('../models/Payment.js')).default;
    const ParkingSlot = (await import('../models/ParkingSlot.js')).default;

    // 1. Ensure Client user exists (client@smartpark.com / Client1234!)
    let clientUser = await User.findOne({ email: 'client@smartpark.com' });
    const clientPassHash = await User.hashPassword('Client1234!');

    if (!clientUser) {
      const john = await User.findOne({ email: 'john.doe@example.com' });
      if (john) {
        john.name = 'Demo Client';
        john.email = 'client@smartpark.com';
        john.passwordHash = clientPassHash;
        john.vehicleNumber = 'KHI-7860';
        await john.save();
        clientUser = john;
        console.log('Updated John Doe to Demo Client (client@smartpark.com)');
      } else {
        clientUser = await User.create({
          name: 'Demo Client',
          email: 'client@smartpark.com',
          passwordHash: clientPassHash,
          role: 'user',
          vehicleNumber: 'KHI-7860',
          accountStatus: 'active',
        });
        console.log('Created Demo Client (client@smartpark.com)');
      }
    } else {
      clientUser.passwordHash = clientPassHash;
      await clientUser.save();
    }

    const adminUser = await User.findOne({ role: 'admin' });

    // 2. Reassign all bookings to clientUser so NO bookings are lost
    const reassigned = await Booking.updateMany(
      { userId: { $ne: adminUser?._id } },
      { $set: { userId: clientUser._id } }
    );
    console.log(`Reassigned ${reassigned.modifiedCount} bookings to clientUser.`);

    // Also reassign payments
    await Payment.updateMany(
      { userId: { $ne: adminUser?._id } },
      { $set: { userId: clientUser._id } }
    );

    // 3. Delete extra demo users (keep ONLY admin and client@smartpark.com)
    const preserveIds = [adminUser?._id, clientUser._id].filter(Boolean);
    const deleted = await User.deleteMany({
      _id: { $nin: preserveIds },
    });
    console.log(`Deleted ${deleted.deletedCount} extra demo users.`);

    // 4. Scale slot rates to PKR scale (e.g. 100 PKR to 250 PKR/hr)
    const slots = await ParkingSlot.find({});
    for (const s of slots) {
      if (s.hourlyRate < 25) {
        s.hourlyRate = Math.round(s.hourlyRate * 25);
        await s.save();
      }
    }
    console.log('Updated slots to PKR hourly rates.');

    // 5. Scale bookings amount to PKR
    const bookings = await Booking.find({});
    for (const b of bookings) {
      if (b.amount < 50) {
        b.amount = Math.round(b.amount * 25);
        await b.save();
      }
    }
    console.log('Updated bookings to PKR amounts.');

    // 6. Scale payments amount to PKR
    const payments = await Payment.find({});
    for (const p of payments) {
      if (p.amount < 50) {
        p.amount = Math.round(p.amount * 25);
        await p.save();
      }
    }
    console.log('Updated payments to PKR amounts.');

    const finalUsers = await User.find({}, 'name email role vehicleNumber');
    const bCount = await Booking.countDocuments();
    console.log('FINAL USERS LIST:', finalUsers);
    console.log(`TOTAL BOOKINGS PRESERVED: ${bCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
};

run();
