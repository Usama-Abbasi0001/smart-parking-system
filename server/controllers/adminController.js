import User from '../models/User.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Basic counts
    const [
      totalUsers,
      totalSlots,
      activeSlots,
      maintenanceSlots,
      todayBookingsCount,
      todayRevenueAgg,
      totalRevenueAgg,
      activeOccupiedBookings,
      upcomingReservations,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      ParkingSlot.countDocuments(),
      ParkingSlot.countDocuments({ active: true, maintenanceStatus: false }),
      ParkingSlot.countDocuments({ maintenanceStatus: true }),
      Booking.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } }),
      Payment.aggregate([
        {
          $match: {
            status: 'paid',
            createdAt: { $gte: startOfToday, $lte: endOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Currently occupied: confirmed booking and startTime <= now <= endTime
      Booking.countDocuments({
        bookingStatus: 'confirmed',
        startTime: { $lte: now },
        endTime: { $gte: now },
      }),
      Booking.countDocuments({
        bookingStatus: { $in: ['confirmed', 'pending_payment'] },
        startTime: { $gt: now },
      }),
    ]);

    const todaySimulatedRevenue = todayRevenueAgg[0]?.total || 0;
    const totalSimulatedRevenue = totalRevenueAgg[0]?.total || 0;

    const currentlyOccupied = activeOccupiedBookings;
    const currentlyAvailable = Math.max(0, activeSlots - currentlyOccupied);
    const occupancyPercentage = activeSlots > 0
      ? Math.round((currentlyOccupied / activeSlots) * 100)
      : 0;

    // 2. Chart: Bookings & Revenue trends for past 7 days
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

      past7Days.push({ dayStart, dayEnd, dayLabel });
    }

    const dailyTrends = await Promise.all(
      past7Days.map(async ({ dayStart, dayEnd, dayLabel }) => {
        const [bookingsCount, revenueAgg] = await Promise.all([
          Booking.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
          Payment.aggregate([
            {
              $match: {
                status: 'paid',
                createdAt: { $gte: dayStart, $lte: dayEnd },
              },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ]);

        return {
          day: dayLabel,
          bookings: bookingsCount,
          revenue: revenueAgg[0]?.total || 0,
        };
      })
    );

    // 3. Chart: Popular Parking Areas Breakdown
    const areaStats = await Booking.aggregate([
      {
        $lookup: {
          from: 'parkingslots',
          localField: 'slotId',
          foreignField: '_id',
          as: 'slot',
        },
      },
      { $unwind: '$slot' },
      {
        $group: {
          _id: '$slot.area',
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0],
            },
          },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 6 },
    ]);

    const formattedAreaStats = areaStats.map((item) => ({
      name: item._id,
      bookings: item.bookings,
      revenue: parseFloat(item.revenue.toFixed(2)),
    }));

    // 4. Recent activity feed
    const [recentBookings, recentPayments, recentUsers] = await Promise.all([
      Booking.find()
        .populate('userId', 'name email vehicleNumber')
        .populate('slotId', 'slotNumber area')
        .sort({ createdAt: -1 })
        .limit(5),
      Payment.find()
        .populate('userId', 'name')
        .populate('bookingId', 'bookingReference')
        .sort({ createdAt: -1 })
        .limit(5),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalSlots,
          activeSlots,
          maintenanceSlots,
          currentlyAvailable,
          currentlyOccupied,
          upcomingReservations,
          todayBookingsCount,
          todaySimulatedRevenue,
          totalSimulatedRevenue,
          occupancyPercentage,
        },
        dailyTrends,
        areaStats: formattedAreaStats,
        recentActivity: {
          bookings: recentBookings,
          payments: recentPayments,
          users: recentUsers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Slots
export const getAdminSlots = async (req, res, next) => {
  try {
    const { search, area, status, page = 1, limit = 15 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { slotNumber: { $regex: search, $options: 'i' } },
        { floorOrZone: { $regex: search, $options: 'i' } },
      ];
    }
    if (area && area !== 'all') {
      query.area = area;
    }
    if (status === 'active') {
      query.active = true;
      query.maintenanceStatus = false;
    } else if (status === 'inactive') {
      query.active = false;
    } else if (status === 'maintenance') {
      query.maintenanceStatus = true;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [slots, total] = await Promise.all([
      ParkingSlot.find(query)
        .sort({ area: 1, slotNumber: 1 })
        .skip(skip)
        .limit(limitNum),
      ParkingSlot.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        slots,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminSlot = async (req, res, next) => {
  try {
    const { slotNumber, area, floorOrZone, hourlyRate, slotType, description } = req.body;

    const existingSlot = await ParkingSlot.findOne({
      area: area.trim(),
      slotNumber: slotNumber.trim().toUpperCase(),
    });

    if (existingSlot) {
      return res.status(409).json({
        success: false,
        message: `Slot "${slotNumber.toUpperCase()}" already exists in area "${area}".`,
      });
    }

    const slot = await ParkingSlot.create({
      slotNumber: slotNumber.trim().toUpperCase(),
      area: area.trim(),
      floorOrZone: floorOrZone.trim(),
      hourlyRate: Number(hourlyRate),
      slotType: slotType || 'standard',
      description: description || '',
      active: true,
      maintenanceStatus: false,
    });

    res.status(201).json({
      success: true,
      message: 'Parking slot created successfully.',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.slotNumber) updates.slotNumber = updates.slotNumber.trim().toUpperCase();
    if (updates.area) updates.area = updates.area.trim();
    if (updates.hourlyRate !== undefined) updates.hourlyRate = Number(updates.hourlyRate);

    // If changing slotNumber or area, verify no collision
    if (updates.slotNumber || updates.area) {
      const current = await ParkingSlot.findById(id);
      if (!current) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }

      const checkArea = updates.area || current.area;
      const checkNumber = updates.slotNumber || current.slotNumber;

      const duplicate = await ParkingSlot.findOne({
        _id: { $ne: id },
        area: checkArea,
        slotNumber: checkNumber,
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Slot "${checkNumber}" already exists in area "${checkArea}".`,
        });
      }
    }

    const updatedSlot = await ParkingSlot.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Slot updated successfully.',
      data: updatedSlot,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminSlotStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active, maintenanceStatus } = req.body;

    const updates = {};
    if (active !== undefined) updates.active = Boolean(active);
    if (maintenanceStatus !== undefined) updates.maintenanceStatus = Boolean(maintenanceStatus);

    const slot = await ParkingSlot.findByIdAndUpdate(id, updates, { new: true });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Slot status updated successfully.',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

// Admin Users
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 15 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
      ];
    }
    // By default in Customer Directory, show regular users/drivers only
    if (role && role !== 'all') {
      query.role = role;
    } else {
      query.role = 'user';
    }
    if (status && status !== 'all') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (status === 'online') {
        query.accountStatus = { $ne: 'deactivated' };
        query.isOnline = true;
        query.lastActive = { $gte: fiveMinutesAgo };
      } else if (status === 'offline') {
        query.accountStatus = { $ne: 'deactivated' };
        query.$or = [
          { isOnline: false },
          { isOnline: { $exists: false } },
          { lastActive: { $lt: fiveMinutesAgo } },
          { lastActive: { $exists: false } },
        ];
      } else if (status === 'deactivated' || status === 'active') {
        query.accountStatus = status;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    // Attach booking counts and accurate online status for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const bookingCount = await Booking.countDocuments({ userId: u._id });
        const lastActiveTime = u.lastActive ? new Date(u.lastActive).getTime() : 0;
        const isOnlineNow = Boolean(u.isOnline && (Date.now() - lastActiveTime <= 5 * 60 * 1000));

        let onlineStatus = 'offline';
        if (u.accountStatus === 'deactivated') {
          onlineStatus = 'deactivated';
        } else if (isOnlineNow) {
          onlineStatus = 'online';
        }

        return {
          ...u.toJSON(),
          bookingCount,
          isOnline: isOnlineNow,
          onlineStatus,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const bookings = await Booking.find({ userId: user._id })
      .populate('slotId', 'slotNumber area floorOrZone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        user,
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!['active', 'deactivated'].includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "deactivated".',
      });
    }

    // Prevent admin from deactivating themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.',
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: `User account has been ${accountStatus}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Admin Bookings
export const getAdminBookings = async (req, res, next) => {
  try {
    const {
      search,
      bookingStatus,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 15,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (bookingStatus && bookingStatus !== 'all') {
      query.bookingStatus = bookingStatus;
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('userId', 'name email vehicleNumber')
        .populate('slotId', 'slotNumber area floorOrZone hourlyRate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportAdminBookingsCSV = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email vehicleNumber')
      .populate('slotId', 'slotNumber area floorOrZone hourlyRate')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Booking Reference',
      'Customer Name',
      'Customer Email',
      'Vehicle Number',
      'Area',
      'Slot Number',
      'Start Time',
      'End Time',
      'Duration (Mins)',
      'Amount ($)',
      'Booking Status',
      'Payment Status',
      'Created At',
    ];

    const rows = bookings.map((b) => [
      b.bookingReference,
      `"${b.userId?.name || 'N/A'}"`,
      b.userId?.email || 'N/A',
      b.vehicleNumber || 'N/A',
      `"${b.slotId?.area || 'N/A'}"`,
      b.slotId?.slotNumber || 'N/A',
      new Date(b.startTime).toISOString(),
      new Date(b.endTime).toISOString(),
      b.durationMinutes,
      b.amount.toFixed(2),
      b.bookingStatus,
      b.paymentStatus,
      new Date(b.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="smart-parking-bookings-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const getAdminReports = async (req, res, next) => {
  try {
    const [
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      revenueSummary,
      paymentStatusCounts,
      slotTypeStats,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      Booking.countDocuments({ bookingStatus: 'cancelled' }),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: null,
            totalSimulatedRevenue: { $sum: '$amount' },
            avgTransaction: { $avg: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Payment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ParkingSlot.aggregate([
        { $group: { _id: '$slotType', count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        cancellationRate:
          totalBookings > 0
            ? parseFloat(((cancelledBookings / totalBookings) * 100).toFixed(1))
            : 0,
        revenueSummary: revenueSummary[0] || {
          totalSimulatedRevenue: 0,
          avgTransaction: 0,
          count: 0,
        },
        paymentStatusCounts,
        slotTypeStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
