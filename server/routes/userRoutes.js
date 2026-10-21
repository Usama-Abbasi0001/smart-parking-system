import express from 'express';
import {
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { getUserDashboardStats } from '../controllers/userDashboardController.js';
import {
  validateUpdateProfile,
  validateChangePassword,
} from '../validators/authValidators.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', validateUpdateProfile, updateProfile);
router.patch('/me/password', validateChangePassword, changePassword);
router.get('/dashboard', getUserDashboardStats);

export default router;
