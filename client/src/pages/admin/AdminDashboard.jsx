import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import {
  Users,
  Car,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setData(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (!data) return null;

  const { summary, dailyTrends, areaStats, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrative Intelligence Console
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System Operations & Occupancy
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 transition-colors"
          >
            Full Analytics Report
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 8 Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Users"
          value={summary.totalUsers}
          subtitle="Drivers & customers"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Parking Slots"
          value={summary.activeSlots}
          subtitle={`${summary.totalSlots} total bays`}
          icon={Layers}
          color="indigo"
        />
        <StatCard
          title="Available Now"
          value={summary.currentlyAvailable}
          subtitle="Vacant bays"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Currently Occupied"
          value={summary.currentlyOccupied}
          subtitle={`${summary.occupancyPercentage}% live occupancy`}
          icon={Car}
          color="rose"
        />
        <StatCard
          title="Today's Reservations"
          value={summary.todayBookingsCount}
          subtitle="Bookings logged today"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Today's Simulated Revenue"
          value={`PKR ${summary.todaySimulatedRevenue.toFixed(2)}`}
          subtitle="Demo earnings"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Demo Revenue"
          value={`PKR ${summary.totalSimulatedRevenue.toFixed(2)}`}
          subtitle="Cumulative paid simulation"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Under Maintenance"
          value={summary.maintenanceSlots}
          subtitle="Bays out of service"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Daily Booking Trends (7-Day Overview)
              </h3>
              <p className="text-xs text-slate-500">Live booking activity across days</p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 w-fit">
              Database Aggregation
            </span>
          </div>

          <div className="h-60 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  name="Bookings"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Areas Bar/Donut Chart */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between animate-fade-in">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Popular Parking Decks</h3>
            <p className="text-xs text-slate-500">Reservations distribution by area</p>
          </div>

          <div className="h-52 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={areaStats}
                  dataKey="bookings"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {areaStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
            {areaStats.map((a, i) => (
              <div key={a.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-700 truncate max-w-[120px]">{a.name}</span>
                </div>
                <span className="font-bold text-slate-900">{a.bookings} bookings</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Customer Bookings</h3>
            <Link
              to="/admin/bookings"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 space-y-2">
            {recentActivity.bookings.map((b) => (
              <div key={b._id} className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900 block">
                    {b.bookingReference}
                  </span>
                  <span className="text-slate-500">
                    {b.userId?.name || 'Customer'} • {b.slotId?.slotNumber} ({b.slotId?.area})
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">PKR {b.amount?.toFixed(2)}</span>
                  <Badge status={b.bookingStatus} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Simulated Transactions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Simulated Payments</h3>
            <Link
              to="/admin/reports"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              Financial Log
            </Link>
          </div>

          <div className="divide-y divide-slate-100 space-y-2">
            {recentActivity.payments.map((p) => (
              <div key={p._id} className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-slate-700 block">
                    {p.transactionReference}
                  </span>
                  <span className="text-slate-400 capitalize">
                    {p.userId?.name} • {p.method.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 block">
                    PKR {p.amount?.toFixed(2)}
                  </span>
                  <Badge status={p.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
