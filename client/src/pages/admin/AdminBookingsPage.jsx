import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../services/api';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  XCircle,
  QrCode,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');

  // Cancel modal
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/bookings', {
        params: {
          page,
          limit: 10,
          search,
          bookingStatus,
          paymentStatus,
        },
      });
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
  }, [bookingStatus, paymentStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings(1);
  };

  const handleExportCSV = async () => {
    try {
      toast.loading('Generating CSV report...');
      const response = await api.get('/admin/bookings/export-csv', {
        responseType: 'blob',
      });
      toast.dismiss();

      // Trigger browser file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `parkpulse-bookings-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV Report downloaded successfully!');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export CSV report');
    }
  };

  const handleAdminCancel = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancelling(true);
      await api.patch(`/admin/bookings/${cancelModalBooking._id}/cancel`, {
        cancellationReason: cancelReason || 'Administrative cancellation',
      });
      toast.success('Booking cancelled and simulated refund processed.');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            All System Bookings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time audit log of all reservations, customer payments, and cancellations
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-colors w-fit cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export All to CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by booking reference or vehicle plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={bookingStatus}
            onChange={(e) => setBookingStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="all">All Booking Statuses</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="There are no reservations matching the given query."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5">Driver / Vehicle</th>
                  <th className="px-6 py-3.5">Slot / Deck</th>
                  <th className="px-6 py-3.5">Time Interval</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {b.bookingReference}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">
                        {b.userId?.name || 'Customer'}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {b.vehicleNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">
                        {b.slotId?.slotNumber}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {b.slotId?.area}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{new Date(b.startTime).toLocaleDateString()}</div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      PKR {b.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 space-x-1">
                      <Badge status={b.bookingStatus} size="sm" />
                      <Badge status={b.paymentStatus} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {b.bookingStatus !== 'cancelled' && b.bookingStatus !== 'completed' && (
                        <button
                          onClick={() => setCancelModalBooking(b)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Cancel / Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(page) => fetchBookings(page)}
          />
        </div>
      )}

      {/* Admin Cancellation Modal */}
      <Modal
        isOpen={!!cancelModalBooking}
        onClose={() => setCancelModalBooking(null)}
        title="Admin Override: Cancel Booking"
        maxWidth="max-w-md"
      >
        {cancelModalBooking && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-900">
                  Cancel Booking {cancelModalBooking.bookingReference}?
                </span>
                This will release slot {cancelModalBooking.slotId?.slotNumber} immediately and
                issue a simulated refund if payment was already confirmed.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Administrative Reason
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Slot maintenance required, customer requested cancellation by phone..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="w-1/2 py-2 px-4 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleAdminCancel}
                className="w-1/2 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl disabled:opacity-50 shadow-md shadow-rose-500/20"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminBookingsPage;
