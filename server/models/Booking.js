import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: [15, 'Minimum booking duration is 15 minutes'],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    bookingStatus: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'cancelled', 'completed', 'expired'],
      default: 'pending_payment',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    qrCodeDataUrl: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high performance overlap queries
bookingSchema.index({ slotId: 1, startTime: 1, endTime: 1, bookingStatus: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
