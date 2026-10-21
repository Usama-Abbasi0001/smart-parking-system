import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';
import {
  checkSlotAvailability,
  getSlotsWithAvailability,
} from '../services/availabilityService.js';

export const getAllSlots = async (req, res, next) => {
  try {
    const {
      area,
      slotType,
      minPrice,
      maxPrice,
      status,
      startTime,
      endTime,
      sortBy = 'slotNumber',
      order = 'asc',
    } = req.query;

    const filter = { active: true };
    if (area && area !== 'All') {
      filter.area = area;
    }
    if (slotType && slotType !== 'all') {
      filter.slotType = slotType;
    }
    if (minPrice || maxPrice) {
      filter.hourlyRate = {};
      if (minPrice) filter.hourlyRate.$gte = Number(minPrice);
      if (maxPrice) filter.hourlyRate.$lte = Number(maxPrice);
    }

    const sortOption = {
      [sortBy]: order === 'desc' ? -1 : 1,
    };

    const slots = await getSlotsWithAvailability(
      startTime,
      endTime,
      filter,
      sortOption
    );

    // If client requested specific status filter (e.g., only 'available')
    let filteredSlots = slots;
    if (status && status !== 'all') {
      filteredSlots = slots.filter((s) => s.currentStatus === status);
    }

    res.status(200).json({
      success: true,
      count: filteredSlots.length,
      data: filteredSlots,
    });
  } catch (error) {
    next(error);
  }
};

export const getSlotById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slot = await ParkingSlot.findById(id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found',
      });
    }

    // Fetch upcoming bookings for this slot (next 48 hours)
    const now = new Date();
    const future = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const schedule = await Booking.find({
      slotId: slot._id,
      bookingStatus: { $in: ['confirmed', 'pending_payment'] },
      endTime: { $gt: now },
      startTime: { $lt: future },
    })
      .select('bookingReference startTime endTime bookingStatus')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        slot,
        schedule,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Both startTime and endTime query parameters are required',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time window provided',
      });
    }

    const result = await checkSlotAvailability(id, start, end);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getDistinctAreas = async (req, res, next) => {
  try {
    const areas = await ParkingSlot.distinct('area', { active: true });
    res.status(200).json({
      success: true,
      data: areas.sort(),
    });
  } catch (error) {
    next(error);
  }
};
