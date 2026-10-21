import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Car,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import Badge from '../../components/common/Badge';

const VerifyBookingPage = () => {
  const { reference } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await api.get(`/bookings/verify/${encodeURIComponent(reference)}`);
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or unverified booking reference');
      } finally {
        setLoading(false);
      }
    };
    if (reference) fetchVerification();
  }, [reference]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur mx-auto flex items-center justify-center mb-2">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">ParkPulse Verification</h2>
          <p className="text-xs text-blue-100 mt-1">Digital QR Parking Check-In Validation</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Verifying booking reference...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">Verification Failed</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">{error}</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Home
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs text-slate-500">Status</span>
                <Badge status={data.validity} text={data.validity.replace('_', ' ')} />
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{data.reference}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Slot Assigned:</span>
                  <span className="font-semibold text-slate-900">{data.slotNumber} ({data.area})</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="font-semibold text-slate-900">{data.vehicleNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Driver:</span>
                  <span className="font-semibold text-slate-900">{data.driverName}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1 pt-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Start: {new Date(data.startTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>End: {new Date(data.endTime).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <Link
                  to="/dashboard"
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors"
                >
                  Go to App Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyBookingPage;
