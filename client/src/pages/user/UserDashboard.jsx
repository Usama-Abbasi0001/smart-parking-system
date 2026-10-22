import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  Car,
  ArrowRight,
  MapPin,
  QrCode,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';

const UserDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-rose-800">Failed to load dashboard data</p>
        <p className="text-xs text-rose-600 mt-1 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { counts, recentBookings, nextUpcomingBooking, welcomeMessage, user } = data;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action */}
      <div className="bg-gradient-to-r from-navy-900 via-royal-900 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
            {isAdmin ? 'Administrative Operations Console' : 'Smart Driver Console'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {welcomeMessage}
          </h1>
          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            {isAdmin
              ? `Live system monitor: ${counts.totalBookings} driver bookings active across commercial parking bays and prime mall decks.`
              : `Your vehicle ${user?.vehicleNumber} is registered. Search real-time parking spaces across prime decks and terminals.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/find-parking"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm rounded-xl shadow-md transition-colors"
            >
              <Car className="w-4 h-4" />
              Find & Reserve Slot
            </Link>
            {isAdmin ? (
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 backdrop-blur transition-colors"
              >
                User Directory
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/my-bookings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 backdrop-blur transition-colors"
              >
                View My Bookings
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 4 Reusable Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={counts.totalBookings}
          subtitle={isAdmin ? "System active reservations" : "All time reservations"}
          icon={CalendarCheck}
          color="blue"
        />
        <StatCard
          title="Upcoming Reservations"
          value={counts.upcomingBookings}
          subtitle="Active & scheduled"
          icon={Clock}
          color="emerald"
        />
        <StatCard
          title="Completed Sessions"
          value={counts.completedBookings}
          subtitle="Successfully concluded"
          icon={CheckCircle}
          color="indigo"
        />
        <StatCard
          title="Cancelled Bookings"
          value={counts.cancelledBookings}
          subtitle="Cancelled / refunded"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Next Upcoming Booking Card (if any) */}
      {nextUpcomingBooking && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {isAdmin ? 'Next System Reservation' : 'Upcoming Reservation'}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Slot {nextUpcomingBooking.slotId?.slotNumber} — {nextUpcomingBooking.slotId?.area}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={nextUpcomingBooking.bookingStatus} />
              <Badge status={nextUpcomingBooking.paymentStatus} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
            <div>
              <span className="text-slate-400 block">Reference</span>
              <span className="font-mono font-semibold text-slate-800 text-sm">
                {nextUpcomingBooking.bookingReference}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Start Time</span>
              <span className="font-medium text-slate-800">
                {new Date(nextUpcomingBooking.startTime).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">End Time</span>
              <span className="font-medium text-slate-800">
                {new Date(nextUpcomingBooking.endTime).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Amount</span>
              <span className="font-bold text-slate-900 text-sm">
                PKR {nextUpcomingBooking.amount?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              to={isAdmin ? `/admin/bookings` : `/my-bookings`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {isAdmin ? 'View in Admin Bookings' : 'View Booking QR Code & Receipt'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Recent Bookings Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isAdmin ? 'Recent System Bookings' : 'Recent Booking History'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAdmin ? 'Live reservations made by registered drivers' : 'Your latest parking reservations'}
            </p>
          </div>
          <Link
            to={isAdmin ? '/admin/bookings' : '/my-bookings'}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View All Bookings
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="No active parking reservations found."
            actionLabel="Find Parking Now"
            onAction={() => (window.location.href = '/find-parking')}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Reference</th>
                    {isAdmin && <th className="px-6 py-3.5">Driver & Vehicle</th>}
                    <th className="px-6 py-3.5">Slot / Area</th>
                    <th className="px-6 py-3.5">Time Interval</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {b.bookingReference}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">
                            {b.userId?.name || 'Driver'}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {b.vehicleNumber || b.userId?.vehicleNumber}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          {b.slotId?.slotNumber || 'Slot'}
                        </span>
                        <span className="text-slate-400 block text-[11px]">
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
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        PKR {b.amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 space-x-1">
                        <Badge status={b.bookingStatus} size="sm" />
                        <Badge status={b.paymentStatus} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {b.bookingStatus === 'pending_payment' ? (
                          <Link
                            to={`/checkout/${b._id}`}
                            className="inline-flex items-center px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm"
                          >
                            Pay Now
                          </Link>
                        ) : (
                          <Link
                            to={isAdmin ? '/admin/bookings' : '/my-bookings'}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Details
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="sm:hidden divide-y divide-slate-100 p-4 space-y-3">
              {recentBookings.map((b) => (
                <div key={b._id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-900 block">
                        {b.bookingReference}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {b.slotId?.slotNumber} • {b.slotId?.area}
                      </span>
                    </div>
                    <span className="font-black text-slate-900 text-sm">
                      PKR {b.amount?.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(b.startTime).toLocaleDateString()}</span>
                    <div className="space-x-1">
                      <Badge status={b.bookingStatus} size="sm" />
                      <Badge status={b.paymentStatus} size="sm" />
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    {b.bookingStatus === 'pending_payment' ? (
                      <Link
                        to={`/checkout/${b._id}`}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold text-center shadow-sm"
                      >
                        Complete Payment
                      </Link>
                    ) : (
                      <Link
                        to="/my-bookings"
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        View QR & Receipt →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
