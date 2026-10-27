import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import { checkSlotAvailability } from '../services/availabilityService.js';
import { generateBookingQRCode } from '../services/qrService.js';
import {
  sendBookingConfirmationEmail,
  sendExtensionConfirmationEmail,
} from '../services/emailService.js';

/**
 * Generate a unique, readable booking reference
 */
const generateReference = () => {
  const timePart = Date.now().toString(36).toUpperCase().slice(-5);
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRK-${timePart}-${randPart}`;
};

/**
 * Generate a unique transaction reference
 */
const generateTransactionRef = () => {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-SIM-${Date.now()}-${rand}`;
};

export const createBooking = async (req, res, next) => {
  try {
    const { slotId, startTime, endTime, vehicleNumber } = req.body;
    const userId = req.user._id;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // 1. Validate slot exists and is operational
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found',
      });
    }

    if (!slot.active) {
      return res.status(400).json({
        success: false,
        message: 'This parking slot is currently inactive and cannot be booked.',
      });
    }

    if (slot.maintenanceStatus) {
      return res.status(400).json({
        success: false,
        message: 'This parking slot is under maintenance and temporarily unavailable.',
      });
    }

    // 2. Concurrency & availability check
    const availability = await checkSlotAvailability(slotId, start, end);
    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: availability.reason || 'This parking slot is not available for the requested time interval.',
        conflict: availability.conflictingBooking,
      });
    }

    // 3. Backend price & duration calculation (never trust frontend-supplied amounts)
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = durationMinutes / 60;
    const calculatedAmount = Math.max(1, parseFloat((hours * slot.hourlyRate).toFixed(2)));

    const bookingReference = generateReference();
    const qrCodeDataUrl = await generateBookingQRCode(bookingReference);

    // Set 15-minute payment window
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const booking = await Booking.create({
      bookingReference,
      userId,
      slotId: slot._id,
      startTime: start,
      endTime: end,
      durationMinutes,
      amount: calculatedAmount,
      bookingStatus: 'pending_payment',
      paymentStatus: 'pending',
      vehicleNumber: (vehicleNumber || req.user.vehicleNumber || 'VEHICLE').toUpperCase(),
      qrCodeDataUrl,
      expiresAt,
    });

    // Populate slot details for immediate response
    await booking.populate('slotId', 'slotNumber area floorOrZone hourlyRate slotType');

    // Create user notification
    await Notification.create({
      userId,
      title: 'Slot Reserved - Awaiting Payment',
      message: `You reserved slot ${slot.slotNumber} in ${slot.area}. Please complete the demo payment within 15 minutes.`,
      type: 'booking',
      bookingId: booking._id,
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please complete demo payment.',
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = { userId: req.user._id };

    const now = new Date();

    if (status && status !== 'all') {
      if (status === 'upcoming') {
        query.bookingStatus = { $in: ['confirmed', 'pending_payment'] };
        query.endTime = { $gte: now };
      } else if (status === 'completed') {
        // Either marked completed or end time passed and confirmed
        query.$or = [
          { bookingStatus: 'completed' },
          { bookingStatus: 'confirmed', endTime: { $lt: now } },
        ];
      } else {
        query.bookingStatus = status;
      }
    }

    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('slotId', 'slotNumber area floorOrZone hourlyRate slotType')
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

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('slotId')
      .populate('userId', 'name email vehicleNumber');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Access control: User can only view their own booking unless Admin
    if (
      req.user.role !== 'admin' &&
      booking.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to view this booking.',
      });
    }

    // Fetch related payment transactions
    const payments = await Payment.find({ bookingId: booking._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: {
        booking,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(id).populate('slotId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check ownership or admin
    const isAdmin = req.user.role === 'admin';
    const isOwner = booking.userId.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this booking.',
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled.',
      });
    }

    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed bookings cannot be cancelled.',
      });
    }

    const wasPaid = booking.paymentStatus === 'paid';
    const slotNumber = booking.slotId?.slotNumber || 'N/A';
    const bookingRef = booking.bookingReference;

    booking.bookingStatus = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason =
      cancellationReason || (isAdmin ? 'Cancelled by Administrator' : 'Cancelled by Driver');

    if (wasPaid) {
      booking.paymentStatus = 'refunded';
    }

    await booking.save();

    // Create cancellation notification
    await Notification.create({
      userId: booking.userId,
      title: 'Booking Cancelled',
      message: `Your booking (${bookingRef}) for slot ${slotNumber} was cancelled.${
        wasPaid ? ' A simulated refund has been credited.' : ''
      }`,
      type: 'cancellation',
      bookingId: booking._id,
    });

    res.status(200).json({
      success: true,
      message: wasPaid
        ? 'Booking cancelled successfully. Simulated refund processed.'
        : 'Booking cancelled successfully.',
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const demoPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { outcome = 'success', method = 'simulated_instant' } = req.body;

    const booking = await Booking.findById(id).populate('slotId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Access control: User can only pay for their own booking
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only simulate payments for your own bookings.',
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid for.',
      });
    }

    if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot pay for a ${booking.bookingStatus} booking.`,
      });
    }

    // If expired, check if we can still confirm or if the slot got taken
    if (booking.bookingStatus === 'expired') {
      const availCheck = await checkSlotAvailability(
        booking.slotId._id,
        booking.startTime,
        booking.endTime,
        booking._id
      );
      if (!availCheck.available) {
        return res.status(409).json({
          success: false,
          message: 'The reservation window expired and this slot is no longer available.',
        });
      }
    }

    const transactionReference = generateTransactionRef();

    if (outcome === 'success') {
      booking.paymentStatus = 'paid';
      booking.bookingStatus = 'confirmed';
      await booking.save();

      const payment = await Payment.create({
        bookingId: booking._id,
        userId: req.user._id,
        amount: booking.amount,
        method,
        transactionReference,
        status: 'paid',
        simulated: true,
      });

      await Notification.create({
        userId: req.user._id,
        title: 'Payment Successful - Booking Confirmed!',
        message: `Your payment of PKR ${Number(booking.amount).toLocaleString()} was processed successfully. Reference: ${booking.bookingReference}.`,
        type: 'payment',
        bookingId: booking._id,
      });

      // Dispatch automated confirmation email with full parking details (non-blocking)
      sendBookingConfirmationEmail({
        user: req.user,
        booking,
        slot: booking.slotId,
        payment,
      }).catch((emailErr) => {
        console.warn('[BookingController] Email dispatch warning:', emailErr.message);
      });

      return res.status(200).json({
        success: true,
        message: 'Simulated payment succeeded! Your parking slot is confirmed.',
        data: {
          booking,
          payment,
          receipt: {
            transactionReference,
            bookingReference: booking.bookingReference,
            slotNumber: booking.slotId.slotNumber,
            area: booking.slotId.area,
            amount: booking.amount,
            paidAt: payment.createdAt,
            method,
            simulated: true,
          },
        },
      });
    } else {
      // Record simulated payment failure
      const payment = await Payment.create({
        bookingId: booking._id,
        userId: req.user._id,
        amount: booking.amount,
        method,
        transactionReference,
        status: 'failed',
        simulated: true,
        failureReason: 'Simulated card decline / test failure scenario',
      });

      booking.paymentStatus = 'failed';
      await booking.save();

      await Notification.create({
        userId: req.user._id,
        title: 'Payment Simulation Failed',
        message: `Payment attempt of PKR ${Number(booking.amount).toLocaleString()} was declined (Demo Test). You may retry before reservation expires.`,
        type: 'payment',
        bookingId: booking._id,
      });

      return res.status(402).json({
        success: false,
        message: 'Simulated payment failed as requested (Test scenario). Please retry.',
        data: {
          booking,
          payment,
          canRetry: booking.bookingStatus !== 'cancelled',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const verifyBookingReference = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const booking = await Booking.findOne({
      bookingReference: reference.toUpperCase().trim(),
    })
      .populate('slotId', 'slotNumber area floorOrZone')
      .populate('userId', 'name vehicleNumber');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Invalid booking reference. Record not found.',
      });
    }

    const now = new Date();
    let validity = 'valid';
    if (booking.bookingStatus === 'cancelled') validity = 'cancelled';
    else if (booking.bookingStatus === 'expired') validity = 'expired';
    else if (booking.paymentStatus !== 'paid') validity = 'unpaid';
    else if (now < booking.startTime) validity = 'upcoming';
    else if (now > booking.endTime) validity = 'completed';
    else validity = 'active_now';

    res.status(200).json({
      success: true,
      data: {
        reference: booking.bookingReference,
        validity,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        slotNumber: booking.slotId?.slotNumber,
        area: booking.slotId?.area,
        startTime: booking.startTime,
        endTime: booking.endTime,
        vehicleNumber: booking.vehicleNumber,
        driverName: booking.userId?.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get extension pricing quote and availability check for proposed extra minutes
 */
export const getExtensionQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestedMinutes = parseInt(req.query.minutes || '60', 10);

    const booking = await Booking.findById(id).populate('slotId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Access control: driver can only access their own reservation unless Admin
    if (
      req.user.role !== 'admin' &&
      booking.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to view this reservation.',
      });
    }

    if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot extend a ${booking.bookingStatus} booking.`,
      });
    }

    const slot = booking.slotId;
    if (!slot || !slot.active || slot.maintenanceStatus) {
      return res.status(400).json({
        success: false,
        message: 'Parking slot is inactive or under maintenance.',
      });
    }

    const currentEndTime = new Date(booking.endTime);
    const newEndTime = new Date(currentEndTime.getTime() + requestedMinutes * 60 * 1000);

    // Concurrency / overlap check for the proposed extension window (excluding current booking)
    const availabilityCheck = await checkSlotAvailability(
      slot._id,
      booking.endTime,
      newEndTime,
      booking._id
    );

    // Calculate incremental amount based strictly on slot's stored hourlyRate
    const hours = requestedMinutes / 60;
    const additionalAmount = Math.max(1, parseFloat((hours * slot.hourlyRate).toFixed(2)));
    const newTotalAmount = parseFloat((booking.amount + additionalAmount).toFixed(2));
    const newTotalMinutes = booking.durationMinutes + requestedMinutes;

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        slotNumber: slot.slotNumber,
        area: slot.area,
        hourlyRate: slot.hourlyRate,
        currentStartTime: booking.startTime,
        currentEndTime: booking.endTime,
        additionalMinutes: requestedMinutes,
        additionalAmount,
        newEndTime,
        newTotalMinutes,
        newTotalAmount,
        isAvailable: availabilityCheck.available,
        reason: availabilityCheck.reason || null,
        conflictingBooking: availabilityCheck.conflictingBooking || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Extend booking duration with simulated incremental payment
 */
export const extendBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      additionalMinutes = 60,
      method = 'simulated_instant',
      outcome = 'success',
    } = req.body;

    const addedMins = parseInt(additionalMinutes, 10);
    if (isNaN(addedMins) || addedMins < 15 || addedMins > 1440) {
      return res.status(400).json({
        success: false,
        message: 'Extension minutes must be between 15 and 1440 (24 hours).',
      });
    }

    const booking = await Booking.findById(id).populate('slotId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Access control: driver can only extend their own reservation unless Admin
    if (
      req.user.role !== 'admin' &&
      booking.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to extend this reservation.',
      });
    }

    if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot extend a ${booking.bookingStatus} booking.`,
      });
    }

    const slot = booking.slotId;
    if (!slot || !slot.active || slot.maintenanceStatus) {
      return res.status(400).json({
        success: false,
        message: 'Parking slot is inactive or under maintenance.',
      });
    }

    const currentEndTime = new Date(booking.endTime);
    const newEndTime = new Date(currentEndTime.getTime() + addedMins * 60 * 1000);

    // Concurrency / overlap check for the proposed extension window
    const availabilityCheck = await checkSlotAvailability(
      slot._id,
      booking.endTime,
      newEndTime,
      booking._id
    );

    if (!availabilityCheck.available) {
      return res.status(409).json({
        success: false,
        message: availabilityCheck.reason || 'This parking slot has a conflicting reservation during the extended time window.',
        conflictingBooking: availabilityCheck.conflictingBooking,
      });
    }

    // Strict server-side incremental price calculation (never trusting frontend-supplied amount)
    const hours = addedMins / 60;
    const additionalAmount = Math.max(1, parseFloat((hours * slot.hourlyRate).toFixed(2)));

    const transactionReference = generateTransactionRef().replace('TXN-SIM', 'TXN-EXT');

    if (outcome === 'success') {
      // 1. Record verified payment for the extension
      const payment = await Payment.create({
        bookingId: booking._id,
        userId: req.user._id,
        amount: additionalAmount,
        method,
        transactionReference,
        status: 'paid',
        simulated: true,
        type: 'extension',
        extensionMinutes: addedMins,
      });

      // 2. Atomically update reservation
      const previousEndTime = booking.endTime;
      booking.endTime = newEndTime;
      booking.durationMinutes += addedMins;
      booking.amount = parseFloat((booking.amount + additionalAmount).toFixed(2));
      booking.bookingStatus = 'confirmed';
      booking.overstayStatus = 'none';

      // If extended by more than 15 minutes into the future, reset reminder flags so driver receives a new reminder
      const now = new Date();
      if (newEndTime.getTime() - now.getTime() > 15 * 60 * 1000) {
        booking.reminderSent15m = false;
        booking.reminderSent15mAt = undefined;
      }
      booking.expiryEmailSent = false;
      booking.expiryEmailSentAt = undefined;

      booking.extensionHistory.push({
        addedMinutes: addedMins,
        additionalAmount,
        previousEndTime,
        newEndTime,
        transactionReference,
        paymentId: payment._id,
        extendedAt: new Date(),
      });

      await booking.save();

      // 3. In-app notification
      await Notification.create({
        userId: req.user._id,
        title: 'Parking Extension Confirmed!',
        message: `Your reservation for slot ${slot.slotNumber} was extended by ${addedMins} minutes until ${newEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        type: 'payment',
        bookingId: booking._id,
      });

      // 4. Dispatch extension confirmation email non-blocking
      sendExtensionConfirmationEmail({
        user: req.user,
        booking,
        slot,
        payment,
        extensionDetails: {
          addedMinutes: addedMins,
          additionalAmount,
        },
      }).catch((emailErr) => {
        console.warn('[BookingController] Extension email dispatch warning:', emailErr.message);
      });

      return res.status(200).json({
        success: true,
        message: `Successfully extended by ${addedMins} minutes! New departure: ${newEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        data: {
          booking,
          payment,
          receipt: {
            transactionReference,
            bookingReference: booking.bookingReference,
            slotNumber: slot.slotNumber,
            area: slot.area,
            addedMinutes: addedMins,
            additionalAmount,
            previousEndTime,
            newEndTime,
            paidAt: payment.createdAt,
            method,
          },
        },
      });
    } else {
      // Record failed payment attempt; do NOT update booking time or duration
      const payment = await Payment.create({
        bookingId: booking._id,
        userId: req.user._id,
        amount: additionalAmount,
        method,
        transactionReference,
        status: 'failed',
        simulated: true,
        type: 'extension',
        extensionMinutes: addedMins,
        failureReason: 'Simulated card decline on extension payment',
      });

      await Notification.create({
        userId: req.user._id,
        title: 'Extension Payment Declined',
        message: `Payment attempt of PKR ${additionalAmount.toLocaleString()} for ${addedMins}-min extension was declined. You may retry.`,
        type: 'payment',
        bookingId: booking._id,
      });

      return res.status(402).json({
        success: false,
        message: 'Extension payment simulation failed as requested (Test Scenario). Reservation end time was not modified.',
        data: {
          booking,
          payment,
          canRetry: true,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

