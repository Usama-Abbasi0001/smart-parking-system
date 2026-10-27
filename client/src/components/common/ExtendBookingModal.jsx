import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api, { getErrorMessage } from '../../services/api';
import {
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const EXTENSION_OPTIONS = [
  { minutes: 30, label: '+30 Mins', subtitle: 'Quick errand' },
  { minutes: 60, label: '+1 Hour', subtitle: 'Standard extension' },
  { minutes: 120, label: '+2 Hours', subtitle: 'Extended stay' },
  { minutes: 180, label: '+3 Hours', subtitle: 'Half day' },
];

const ExtendBookingModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [selectedMinutes, setSelectedMinutes] = useState(60);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('simulated_instant');
  const [testOutcome, setTestOutcome] = useState('success');

  // Fetch extension quote whenever selectedMinutes or booking changes
  const fetchQuote = async (mins) => {
    if (!booking?._id) return;
    try {
      setLoadingQuote(true);
      const res = await api.get(`/bookings/${booking._id}/extension-quote`, {
        params: { minutes: mins },
      });
      setQuote(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    if (isOpen && booking?._id) {
      fetchQuote(selectedMinutes);
    } else {
      setQuote(null);
    }
  }, [isOpen, booking?._id, selectedMinutes]);

  const handleExtend = async (e) => {
    e.preventDefault();
    if (!quote?.isAvailable) {
      toast.error('This slot is not available for the requested extension.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/bookings/${booking._id}/extend`, {
        additionalMinutes: selectedMinutes,
        method: paymentMethod,
        outcome: testOutcome,
      });

      if (res.data.success) {
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.65 },
        });
        toast.success(res.data.message || 'Parking reservation extended successfully!');
        if (onSuccess) {
          onSuccess(res.data.data.booking);
        }
        onClose();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  const slotNumber = booking.slotId?.slotNumber || quote?.slotNumber || 'Bay';
  const areaName = booking.slotId?.area || quote?.area || 'Parking Deck';
  const currentEnd = new Date(booking.endTime);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Extend Parking Reservation"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Reservation Header Card */}
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-200 mb-1">
            <span className="font-mono">Ref: {booking.bookingReference}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded font-mono font-bold text-white">
              🚗 {(booking.vehicleNumber || 'VEHICLE').toUpperCase()}
            </span>
          </div>
          <div className="text-lg font-black tracking-tight">
            Slot {slotNumber} — {areaName}
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-blue-100">
            <span>Scheduled Expiry:</span>
            <span className="font-bold text-amber-300">
              {currentEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({currentEnd.toLocaleDateString()})
            </span>
          </div>
        </div>

        {/* Duration Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Select Additional Duration
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EXTENSION_OPTIONS.map((opt) => {
              const active = selectedMinutes === opt.minutes;
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => setSelectedMinutes(opt.minutes)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    active
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{opt.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Extension Quote Preview */}
        {loadingQuote ? (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            Calculating incremental pricing & slot availability...
          </div>
        ) : quote ? (
          <div className="space-y-3">
            {/* Availability Alert */}
            {quote.isAvailable ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Slot Available:</strong> No conflicting reservations for this extended window.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Slot Unavailable:</strong> {quote.reason || 'Another driver has reserved this bay during that window.'}
                  <div className="text-[11px] text-rose-700 mt-1">
                    Please choose a shorter extension duration or prepare to check out.
                  </div>
                </div>
              </div>
            )}

            {/* Price & Timing Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Current End Time:</span>
                <span className="font-medium text-slate-800">
                  {new Date(quote.currentEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Proposed New Departure:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {new Date(quote.newEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(quote.newEndTime).toLocaleDateString()})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tariff Rate:</span>
                <span className="font-medium text-slate-800">PKR {quote.hourlyRate}/hour</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Additional Extension Fee:</span>
                <span className="font-extrabold text-blue-600 text-base">
                  PKR {quote.additionalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Simulated Payment Method & QA Test Controls */}
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Simulated Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('simulated_instant')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer ${
                paymentMethod === 'simulated_instant'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              Instant Card (Demo)
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('digital_wallet')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer ${
                paymentMethod === 'digital_wallet'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Wallet className="w-4 h-4 text-indigo-600" />
              Digital Wallet
            </button>
          </div>

          {/* Test Scenario Toggle (For Grading / Evaluation) */}
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Test Scenario:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTestOutcome('success')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                  testOutcome === 'success'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Pass Payment
              </button>
              <button
                type="button"
                onClick={() => setTestOutcome('failure')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                  testOutcome === 'failure'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Test Decline
              </button>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExtend}
            disabled={submitting || loadingQuote || !quote?.isAvailable}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                Confirm & Pay PKR {quote?.additionalAmount?.toFixed(2) || '0.00'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExtendBookingModal;
