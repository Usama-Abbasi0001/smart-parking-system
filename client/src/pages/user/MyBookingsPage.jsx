import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import {
  CalendarCheck,
  Search,
  Filter,
  QrCode,
  Receipt,
  XCircle,
  CreditCard,
  Clock,
  Car,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [qrModalBooking, setQrModalBooking] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const tabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'pending_payment', label: 'Pending Payment' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 8,
        status: activeTab,
        search,
      };

      const res = await api.get('/bookings/my', { params });
      setBookings(res.data.data.bookings || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings(1);
  };

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancelling(true);
      const res = await api.patch(`/bookings/${cancelModalBooking._id}/cancel`, {
        cancellationReason: cancelReason,
      });
      toast.success(res.data.message || 'Booking cancelled successfully');
      setCancelModalBooking(null);
      setCancelReason('');
      fetchBookings(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Parking Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your active sessions, reservation history, and digital receipts
          </p>
        </div>
        <Link
          to="/find-parking"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors w-fit"
        >
          <Car className="w-4 h-4" />
          Book New Parking Slot
        </Link>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by booking reference (e.g. PRK-...) or vehicle plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Bookings Content */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings in this category"
          description="You don't have any reservations matching this status filter."
          actionLabel="Find Available Slots"
          onAction={() => (window.location.href = '/find-parking')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5">Slot / Area</th>
                  <th className="px-6 py-3.5">Vehicle</th>
                  <th className="px-6 py-3.5">Schedule</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bookings.map((b) => {
                  const canCancel =
                    !['cancelled', 'completed'].includes(b.bookingStatus) &&
                    new Date(b.endTime).getTime() > Date.now();
                  const canPay = b.bookingStatus === 'pending_payment';

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {b.bookingReference}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">
                          {b.slotId?.slotNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {b.slotId?.area} ({b.slotId?.floorOrZone})
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                        {b.vehicleNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div>{new Date(b.startTime).toLocaleDateString()}</div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ${b.amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 space-x-1">
                        <Badge status={b.bookingStatus} size="sm" />
                        <Badge status={b.paymentStatus} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* QR Code view */}
                          {b.qrCodeDataUrl && (
                            <button
                              onClick={() => setQrModalBooking(b)}
                              title="View Digital QR Pass"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}

                          {/* Pay Now Button */}
                          {canPay && (
                            <Link
                              to={`/checkout/${b._id}`}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                            >
                              Pay Now
                            </Link>
                          )}

                          {/* Details Button */}
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Details
                          </button>

                          {/* Cancel Button */}
                          {canCancel && (
                            <button
                              onClick={() => setCancelModalBooking(b)}
                              className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100 p-4 space-y-4">
            {bookings.map((b) => (
              <div key={b._id} className="pt-4 first:pt-0 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-900 block">
                      {b.bookingReference}
                    </span>
                    <span className="text-xs text-slate-500">
                      {b.slotId?.slotNumber} • {b.slotId?.area}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 text-sm">
                      ${b.amount?.toFixed(2)}
                    </span>
                    <div className="mt-1">
                      <Badge status={b.bookingStatus} size="sm" />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex justify-between">
                  <span>{new Date(b.startTime).toLocaleString()}</span>
                  <span className="font-mono">{b.vehicleNumber}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  {b.qrCodeDataUrl && (
                    <button
                      onClick={() => setQrModalBooking(b)}
                      className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      QR Pass
                    </button>
                  )}
                  {b.bookingStatus === 'pending_payment' && (
                    <Link
                      to={`/checkout/${b._id}`}
                      className="flex-1 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg text-center"
                    >
                      Pay Now
                    </Link>
                  )}
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="flex-1 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(page) => fetchBookings(page)}
          />
        </div>
      )}

      {/* QR Code Pass Modal */}
      <Modal
        isOpen={!!qrModalBooking}
        onClose={() => setQrModalBooking(null)}
        title="Digital QR Parking Pass"
        maxWidth="max-w-sm"
      >
        {qrModalBooking && (
          <div className="text-center space-y-4 py-2">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
              <img
                src={qrModalBooking.qrCodeDataUrl}
                alt="QR Code"
                className="w-48 h-48 rounded-xl mx-auto shadow-sm"
              />
            </div>
            <div>
              <span className="font-mono font-bold text-base text-slate-900">
                {qrModalBooking.bookingReference}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Slot {qrModalBooking.slotId?.slotNumber} ({qrModalBooking.slotId?.area})
              </p>
              <p className="text-[11px] text-slate-400">
                Vehicle: {qrModalBooking.vehicleNumber}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-800">
              Present this code at parking boom barrier or to smart parking attendants for instantaneous check-in validation.
            </p>
          </div>
        )}
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Reservation Details & Receipt"
        maxWidth="max-w-md"
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Reference</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedBooking.bookingReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slot Assigned</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.slotId?.slotNumber} ({selectedBooking.slotId?.area})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Floor / Zone</span>
                <span className="font-medium text-slate-800">
                  {selectedBooking.slotId?.floorOrZone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Registered</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedBooking.vehicleNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Start Time</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedBooking.startTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">End Time</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedBooking.endTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                <span className="text-slate-900">Total Price</span>
                <span className="text-slate-900">${selectedBooking.amount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500">Current Status</span>
              <div className="space-x-1">
                <Badge status={selectedBooking.bookingStatus} size="sm" />
                <Badge status={selectedBooking.paymentStatus} size="sm" />
              </div>
            </div>

            {selectedBooking.cancellationReason && (
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-800">
                <span className="font-bold block">Cancellation Note:</span>
                {selectedBooking.cancellationReason}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={!!cancelModalBooking}
        onClose={() => setCancelModalBooking(null)}
        title="Cancel Parking Booking"
        maxWidth="max-w-md"
      >
        {cancelModalBooking && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-900">
                  Are you sure you want to cancel this booking?
                </span>
                Slot {cancelModalBooking.slotId?.slotNumber} will immediately become available
                for other drivers. If you have already completed simulated payment, an automatic
                simulated refund will be recorded.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Change of schedule, booked wrong terminal, etc."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelBooking}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md shadow-rose-500/20 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBookingsPage;
