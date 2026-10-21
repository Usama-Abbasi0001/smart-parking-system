import express from 'express';
import {
  getAllSlots,
  getSlotById,
  checkAvailability,
  getDistinctAreas,
} from '../controllers/slotController.js';

const router = express.Router();

router.get('/', getAllSlots);
router.get('/areas', getDistinctAreas);
router.get('/:id', getSlotById);
router.get('/:id/availability', checkAvailability);

export default router;
