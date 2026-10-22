import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_smart_parking_fyp_key_2026_secure';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId, role }, secret, { expiresIn });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, vehicleNumber } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const cleanVehicle = vehicleNumber.trim().toUpperCase();
    const escapedVehicle = cleanVehicle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const existingVehicle = await User.findOne({
      vehicleNumber: { $regex: new RegExp(`^${escapedVehicle}$`, 'i') },
    });
    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: 'An account with this vehicle plate number already exists.',
      });
    }

    const passwordHash = await User.hashPassword(password);

    // Public registration ALWAYS assigns role: 'user'
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'user',
      vehicleNumber: cleanVehicle,
      accountStatus: 'active',
    });

    // Create a welcoming in-app notification
    await Notification.create({
      userId: newUser._id,
      title: 'Welcome to ParkPulse!',
      message: `Welcome, ${newUser.name}! Your account is active. You can now search for parking slots and make real-time reservations.`,
      type: 'system',
    });

    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || req.body.vehicleNumber || '').trim();
    const { password } = req.body;

    if (!rawIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your vehicle plate number or email address.',
      });
    }

    const escapedIdentifier = rawIdentifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // Find user by either email or vehicle registration number (both case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: rawIdentifier.toLowerCase() },
        { vehicleNumber: { $regex: new RegExp(`^${escapedIdentifier}$`, 'i') } },
      ],
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid vehicle number/email or password.',
      });
    }

    if (user.accountStatus === 'deactivated') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid vehicle number/email or password.',
      });
    }

    const token = generateToken(user._id, user.role);

    // Return safe user object without password
    const safeUser = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, vehicleNumber } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (vehicleNumber) updates.vehicleNumber = vehicleNumber.trim().toUpperCase();

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match our records.',
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    await Notification.create({
      userId: user._id,
      title: 'Security Notice',
      message: 'Your account password was updated successfully.',
      type: 'system',
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
