import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';

export const getUserDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      pendingPaymentBookings,
      recentBookings,
      nextUpcomingBooking,
      unreadNotificationsCount,
    ] = await Promise.all([
      Booking.countDocuments({ userId }),
      Booking.countDocuments({
        userId,
        bookingStatus: { $in: ['confirmed', 'pending_payment'] },
        startTime: { $gte: now },
      }),
      Booking.countDocuments({
        userId,
        $or: [
          { bookingStatus: 'completed' },
          { bookingStatus: 'confirmed', endTime: { $lt: now } },
        ],
      }),
      Booking.countDocuments({ userId, bookingStatus: 'cancelled' }),
      Booking.countDocuments({ userId, bookingStatus: 'pending_payment' }),
      Booking.find({ userId })
        .populate('slotId', 'slotNumber area floorOrZone hourlyRate slotType')
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.findOne({
        userId,
        bookingStatus: 'confirmed',
        endTime: { $gte: now },
      })
        .populate('slotId', 'slotNumber area floorOrZone hourlyRate slotType')
        .sort({ startTime: 1 }),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        welcomeMessage: `Welcome back, ${req.user.name.split(' ')[0]}!`,
        user: {
          name: req.user.name,
          email: req.user.email,
          vehicleNumber: req.user.vehicleNumber,
        },
        counts: {
          totalBookings,
          upcomingBookings,
          completedBookings,
          cancelledBookings,
          pendingPaymentBookings,
          unreadNotificationsCount,
        },
        recentBookings,
        nextUpcomingBooking,
      },
    });
  } catch (error) {
    next(error);
  }
};
