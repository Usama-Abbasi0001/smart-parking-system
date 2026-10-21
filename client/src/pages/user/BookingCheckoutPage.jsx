import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Car,
  Clock,
  ArrowLeft,
  Receipt,
  Download,
  AlertTriangle,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const BookingCheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [failureError, setFailureError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${id}`);
        setBooking(res.data.data.booking);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBooking();
  }, [id]);

  const handleSimulatePayment = async (outcome) => {
    try {
      setProcessing(true);
      setFailureError(null);

      const res = await api.post(`/bookings/${id}/demo-payment`, {
        outcome,
        method: paymentMethod,
      });

      if (outcome === 'success') {
        setReceipt(res.data.data.receipt);
        setBooking(res.data.data.booking);
        // Confetti celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success('Simulated payment confirmed! Your bay is reserved.');
      }
    } catch (err) {
      if (outcome === 'failure') {
        setFailureError(
          err.response?.data?.message || 'Payment simulation declined as requested.'
        );
        toast.error('Simulation: Payment Declined');
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading checkout session...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Booking Session Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested booking does not exist or has expired.
        </p>
        <Link
          to="/find-parking"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Find Available Slots
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/find-parking"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Parking Availability
        </Link>
      </div>

      {/* Demo Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold block text-amber-900 mb-0.5">
            FYP Demo Simulation Module
          </span>
          No real financial transaction or sensitive card data is collected. Use the
          simulation buttons below to test both successful payment confirmation and test
          failure flows.
        </div>
      </div>

      {/* Success Receipt State */}
      {receipt ? (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Payment Confirmed!</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Your parking slot is officially reserved and locked in the database
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Receipt details */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Booking Reference</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {receipt.bookingReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono text-slate-700">{receipt.transactionReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Slot</span>
                <span className="font-bold text-slate-900">
                  {receipt.slotNumber} ({receipt.area})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Simulation</span>
                <span className="font-semibold text-emerald-700 capitalize">
                  {receipt.method.replace('_', ' ')} (Simulated)
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                <span className="text-slate-900">Amount Paid</span>
                <span className="text-slate-900 font-black">${receipt.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* QR Code Check-in */}
            {booking.qrCodeDataUrl && (
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 mb-2">
                  Digital QR Check-In Pass
                </span>
                <img
                  src={booking.qrCodeDataUrl}
                  alt="Booking QR Code"
                  className="w-40 h-40 rounded-xl shadow-sm border border-slate-300"
                />
                <span className="text-[10px] text-slate-400 mt-2">
                  Scan at barrier or present to parking attendant
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/my-bookings"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center rounded-xl shadow-md text-xs transition-colors"
              >
                Go to My Bookings
              </Link>
              <Link
                to="/find-parking"
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-center rounded-xl text-xs transition-colors"
              >
                Book Another Slot
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Checkout Summary & Action Buttons */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Step 2: Simulated Checkout
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Confirm Reservation & Payment
                </h2>
              </div>
              <Badge status={booking.bookingStatus} />
            </div>

            {/* Booking Details Breakdown */}
            <div className="mt-6 bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Reserved Slot</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {booking.slotId?.slotNumber} ({booking.slotId?.area})
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Floor / Zone</span>
                <span className="font-medium text-slate-800">
                  {booking.slotId?.floorOrZone}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Start Time</span>
                <span className="font-medium text-slate-800">
                  {new Date(booking.startTime).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">End Time</span>
                <span className="font-medium text-slate-800">
                  {new Date(booking.endTime).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Duration</span>
                <span className="font-semibold text-slate-800">
                  {booking.durationMinutes} minutes ({parseFloat((booking.durationMinutes / 60).toFixed(2))} hrs)
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-base font-extrabold">
                <span className="text-slate-900">Total Amount Due</span>
                <span className="text-blue-600 font-black text-xl">
                  ${booking.amount?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Simulated Payment Method Selector */}
            <div className="mt-6 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Simulated Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'credit_card', label: 'Credit Card (Demo)', icon: CreditCard },
                  { id: 'digital_wallet', label: 'Apple/Google Pay', icon: Wallet },
                  { id: 'simulated_instant', label: 'Instant Sim Pay', icon: ShieldCheck },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-blue-600" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test Failure Feedback (if triggered) */}
            {failureError && (
              <div className="mt-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800">
                  <span className="font-bold block text-rose-900">
                    Payment Simulation Failed (Test Case)
                  </span>
                  {failureError} You may test the retry option below.
                </div>
              </div>
            )}

            {/* Action Simulation Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleSimulatePayment('success')}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                {processing ? 'Processing Simulation...' : `Simulate Successful Payment ($${booking.amount?.toFixed(2)})`}
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => handleSimulatePayment('failure')}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-500" />
                Simulate Payment Failure Scenario (Test Declined Card)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCheckoutPage;
