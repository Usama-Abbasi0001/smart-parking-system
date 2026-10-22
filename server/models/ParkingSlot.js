import mongoose from 'mongoose';

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: [true, 'Slot number is required (e.g., A-101)'],
      trim: true,
      uppercase: true,
    },
    area: {
      type: String,
      required: [true, 'Parking area is required (e.g., Central Plaza, Terminal 1)'],
      trim: true,
    },
    floorOrZone: {
      type: String,
      required: [true, 'Floor or Zone is required (e.g., Floor 1, Zone B)'],
      trim: true,
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative'],
      default: 5.0,
    },
    slotType: {
      type: String,
      enum: ['car', 'bike', 'cycle', 'standard', 'accessible', 'ev_charging', 'compact', 'vip'],
      default: 'car',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    maintenanceStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate slot numbers within the same parking area
parkingSlotSchema.index({ area: 1, slotNumber: 1 }, { unique: true });
parkingSlotSchema.index({ active: 1, maintenanceStatus: 1 });

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);
export default ParkingSlot;
