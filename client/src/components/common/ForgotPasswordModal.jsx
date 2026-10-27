import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api, { getErrorMessage } from '../../services/api';
import { Lock, Eye, EyeOff, Car, CheckCircle2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordModal = ({ isOpen, onClose, initialIdentifier = '', onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Auto-populate from login field or logged in user storage if available
      const storedUser = localStorage.getItem('parkpulse_user');
      let defaultId = initialIdentifier;
      if (!defaultId && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          defaultId = parsed.vehicleNumber || parsed.email || '';
        } catch {
          // ignore
        }
      }
      setIdentifier(defaultId || '');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, initialIdentifier]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const targetId = identifier.trim() || initialIdentifier.trim();
    if (!targetId) {
      toast.error('Please enter your registered email address or vehicle plate number');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        identifier: targetId,
        newPassword,
      });
      setLoading(false);

      if (res.data.success) {
        // "current login ko remove kar do": Clear any existing login token & user session
        localStorage.removeItem('parkpulse_token');
        localStorage.removeItem('parkpulse_user');

        toast.success('Password updated successfully! Please log in with your new password.');
        onClose();
        if (onSuccess) {
          onSuccess(targetId);
        }
      }
    } catch (err) {
      setLoading(false);
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set New Password"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* If identifier is already provided from login input, show a verified badge */}
        {initialIdentifier ? (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs">
            <span className="flex items-center gap-1.5 font-medium text-blue-900">
              <Car className="w-4 h-4 text-blue-600" />
              Account:
            </span>
            <span className="font-mono font-bold text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-sm">
              {initialIdentifier}
            </span>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email or Vehicle Plate Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Car className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. BMW007 or driver@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Add New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Setting Password...' : 'Set Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ForgotPasswordModal;
