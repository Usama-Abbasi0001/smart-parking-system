import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';

export const getUserDashboardStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userId = req.user._id;
    // For admin, pull system-wide bookings so cards reflect real-time activity; for regular drivers, filter by their own userId
    const baseFilter = isAdmin ? {} : { userId };
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
      // Total active & confirmed reservations (excluding cancelled)
      Booking.countDocuments({
        ...baseFilter,
        bookingStatus: { $ne: 'cancelled' },
      }),
      // Upcoming reservations
      Booking.countDocuments({
        ...baseFilter,
        bookingStatus: { $in: ['confirmed', 'pending_payment'] },
        startTime: { $gte: now },
      }),
      // Completed sessions
      Booking.countDocuments({
        ...baseFilter,
        $or: [
          { bookingStatus: 'completed' },
          { bookingStatus: 'confirmed', endTime: { $lt: now } },
        ],
      }),
      // Cancelled bookings
      Booking.countDocuments({
        ...baseFilter,
        bookingStatus: 'cancelled',
      }),
      // Pending payment bookings
      Booking.countDocuments({
        ...baseFilter,
        bookingStatus: 'pending_payment',
      }),
      // Recent active bookings
      Booking.find({
        ...baseFilter,
        bookingStatus: { $ne: 'cancelled' },
      })
        .populate('slotId', 'slotNumber area floorOrZone hourlyRate slotType')
        .populate('userId', 'name email vehicleNumber')
        .sort({ createdAt: -1 })
        .limit(5),
      // Next upcoming reservation
      Booking.findOne({
        ...baseFilter,
        bookingStatus: 'confirmed',
        endTime: { $gte: now },
      })
        .populate('slotId', 'slotNumber area floorOrZone hourlyRate slotType')
        .populate('userId', 'name email vehicleNumber')
        .sort({ startTime: 1 }),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        welcomeMessage: isAdmin
          ? `Welcome back, Admin ${req.user.name.split(' ')[0]}!`
          : `Welcome back, ${req.user.name.split(' ')[0]}!`,
        user: {
          name: req.user.name,
          email: req.user.email,
          vehicleNumber: req.user.vehicleNumber,
          role: req.user.role,
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
