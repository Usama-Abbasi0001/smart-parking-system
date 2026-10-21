import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../services/api';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Car,
  FileSpreadsheet,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const AdminReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports');
      setReport(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = async () => {
    try {
      toast.loading('Generating CSV report...');
      const response = await api.get('/admin/bookings/export-csv', {
        responseType: 'blob',
      });
      toast.dismiss();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `smart-parking-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully!');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export CSV report');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial & Operational Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Aggregated system metrics, cancellation analysis, and revenue summaries
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 transition-colors w-fit cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Live CSV Report
        </button>
      </div>

      {/* Demo Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
        <span className="font-bold block text-blue-900 mb-0.5">
          Software-Only Final Year Project Notice
        </span>
        All monetary amounts and transaction counts reflect simulated test scenarios.
        No real credit cards or financial processing networks are invoked.
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Lifetime Bookings"
          value={report.totalBookings}
          subtitle="System all-time volume"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Confirmed Sessions"
          value={report.confirmedBookings}
          subtitle="Successfully reserved"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="System Cancellation Rate"
          value={`${report.cancellationRate}%`}
          subtitle={`${report.cancelledBookings} cancelled bookings`}
          icon={Percent}
          color={report.cancellationRate > 25 ? 'rose' : 'amber'}
        />
        <StatCard
          title="Simulated Revenue"
          value={`$${report.revenueSummary.totalSimulatedRevenue?.toFixed(2) || '0.00'}`}
          subtitle={`Avg $${report.revenueSummary.avgTransaction?.toFixed(2) || '0.00'} / booking`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Outcomes Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Payment Simulation Breakdown
          </h3>
          <p className="text-xs text-slate-500">
            Distribution of simulated transaction states
          </p>

          <div className="space-y-3 pt-2">
            {report.paymentStatusCounts?.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Badge status={item._id} text={item._id} />
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  {item.count} transactions
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Slot Types Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Parking Bay Inventory by Type
          </h3>
          <p className="text-xs text-slate-500">
            Current configuration across all parking structures
          </p>

          <div className="space-y-3 pt-2">
            {report.slotTypeStats?.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Badge status={item._id} text={item._id.replace('_', ' ')} />
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  {item.count} configured bays
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
