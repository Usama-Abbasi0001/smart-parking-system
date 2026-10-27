import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Car,
  Calendar,
  Shield,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const UserProfilePage = () => {
  const { user, isAdmin, updateProfile, changePassword } = useAuth();

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setVehicleNumber(user.vehicleNumber || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      setUpdatingProfile(true);
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      };
      if (!isAdmin) {
        payload.vehicleNumber = vehicleNumber.trim().toUpperCase();
      }
      await updateProfile(payload);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await changePassword(currentPassword, newPassword);
      if (res?.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          {isAdmin ? (
            <>
              <ShieldCheck className="w-7 h-7 text-purple-600" />
              <span>Admin Profile & Account Settings</span>
            </>
          ) : (
            <>
              <User className="w-7 h-7 text-blue-600" />
              <span>User Profile & Vehicle Settings</span>
            </>
          )}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isAdmin
            ? 'Manage your administrator account credentials, email address, and security password'
            : 'Manage your personal driver details, contact information, and default vehicle registration'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Summary Sidebar Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 h-fit">
          <div className="text-center pb-4 border-b border-slate-100">
            <div
              className={`w-16 h-16 rounded-3xl text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md ${
                isAdmin
                  ? 'bg-gradient-to-tr from-purple-700 to-indigo-700'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
              }`}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">{user?.name}</h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <div className="mt-2.5">
              <Badge status={user?.role} text={isAdmin ? 'Administrator' : 'Registered Driver'} size="sm" />
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {!isAdmin ? (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Car className="w-3.5 h-3.5" />
                  Active Plate:
                </span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {user?.vehicleNumber || 'None'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Access Level:
                </span>
                <span className="font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  Root Admin
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Member Since:
              </span>
              <span className="font-medium text-slate-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Shield className="w-3.5 h-3.5" />
                Account Status:
              </span>
              <Badge status={user?.accountStatus} size="sm" />
            </div>
          </div>
        </div>

        {/* Edit Forms Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Form 1: Personal & Contact Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-0.5">
                {isAdmin ? 'Profile Details' : 'Personal & Vehicle Details'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Update your administrator name and login email address'
                  : 'Update your display name, contact email, and default vehicle license plate'}
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address / Gmail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used for sign-in and automated parking pass confirmations.
                </p>
              </div>

              {/* Show Vehicle Plate field ONLY for non-admin regular drivers */}
              {!isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Default Vehicle License Plate
                  </label>
                  <div className="relative">
                    <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. BMW-007"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl uppercase font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Password & Security Update */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-0.5 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Security & Password Update</span>
              </h3>
              <p className="text-xs text-slate-500">
                Change your account password securely (minimum 6 characters)
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {changingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
