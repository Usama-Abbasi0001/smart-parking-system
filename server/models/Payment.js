import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount must be positive'],
    },
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'digital_wallet', 'simulated_instant'],
      default: 'simulated_instant',
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['paid', 'failed', 'refunded'],
      required: true,
      index: true,
    },
    simulated: {
      type: Boolean,
      default: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
