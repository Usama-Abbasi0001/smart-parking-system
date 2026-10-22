import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../services/api';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Car,
  Mail,
  Calendar,
  Eye,
  Shield,
  Clock,
  MoreVertical,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('user');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openMenuUserId, setOpenMenuUserId] = useState(null);

  // User details modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Close three dots dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuUserId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchUsers = async (page = 1, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get('/admin/users', {
        params: {
          page,
          limit: 10,
          search,
          role: roleFilter,
          status: statusFilter,
        },
      });
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      if (!isSilent) toast.error(getErrorMessage(err));
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    const interval = setInterval(() => {
      fetchUsers(pagination.page || 1, true);
    }, 12000);
    return () => clearInterval(interval);
  }, [roleFilter, statusFilter, pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.accountStatus === 'active' ? 'deactivated' : 'active';
    try {
      await api.patch(`/admin/users/${user._id}/status`, { accountStatus: newStatus });
      toast.success(`User ${user.name} has been ${newStatus}.`);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleViewUser = async (userId) => {
    try {
      setModalLoading(true);
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUser(res.data.data.user);
      setUserBookings(res.data.data.bookings || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          User & Customer Directory
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View registered drivers, track booking counts, and manage access privileges
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by driver name, email, or vehicle plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="user">Registered Drivers (Users)</option>
            <option value="admin">Administrators</option>
            <option value="all">All Accounts</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="online">🟢 Online Drivers</option>
            <option value="offline">⚪ Offline Drivers</option>
            <option value="deactivated">🔴 Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users match the criteria"
          description="Try modifying your search query or role/status filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[300px]">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto min-h-[260px] pb-24">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Vehicle Plate</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Bookings</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {u.vehicleNumber}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={u.role} text={u.role} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {u.bookingCount || 0} bookings
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        status={
                          u.onlineStatus ||
                          (u.accountStatus === 'deactivated'
                            ? 'deactivated'
                            : u.isOnline
                            ? 'online'
                            : 'offline')
                        }
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenMenuUserId(openMenuUserId === u._id ? null : u._id)}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                            openMenuUserId === u._id
                              ? 'bg-slate-200 text-slate-900 shadow-xs ring-2 ring-slate-300'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Actions Menu"
                          aria-label="Actions Menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuUserId === u._id && (
                          <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-scale-in text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuUserId(null);
                                handleViewUser(u._id);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer text-left"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>View History</span>
                            </button>

                            {u.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuUserId(null);
                                  handleToggleStatus(u);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer text-left border-t border-slate-100 ${
                                  u.accountStatus === 'active'
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {u.accountStatus === 'active' ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Activate</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100 p-4 space-y-3">
            {users.map((u) => (
              <div key={u._id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">{u.name}</span>
                    <span className="text-xs text-slate-500">{u.email}</span>
                  </div>
                  <Badge status={u.role} text={u.role} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-mono font-bold text-slate-800">Plate: {u.vehicleNumber}</span>
                  <span className="font-semibold text-slate-700">{u.bookingCount || 0} bookings</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Badge
                    status={
                      u.onlineStatus ||
                      (u.accountStatus === 'deactivated'
                        ? 'deactivated'
                        : u.isOnline
                        ? 'online'
                        : 'offline')
                    }
                    size="sm"
                  />
                  <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setOpenMenuUserId(openMenuUserId === u._id ? null : u._id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        openMenuUserId === u._id
                          ? 'bg-slate-200 text-slate-900'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      aria-label="Actions Menu"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuUserId === u._id && (
                      <div className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-scale-in text-left">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuUserId(null);
                            handleViewUser(u._id);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View History</span>
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuUserId(null);
                              handleToggleStatus(u);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-left cursor-pointer border-t border-slate-100 ${
                              u.accountStatus === 'active'
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.accountStatus === 'active' ? (
                              <>
                                <UserX className="w-3.5 h-3.5 text-rose-500" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(page) => fetchUsers(page)}
          />
        </div>
      )}

      {/* User Details & History Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Driver Account & Booking History"
        maxWidth="max-w-2xl"
      >
        {selectedUser && (
          <div className="space-y-5 text-xs">
            {/* User overview */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block">Customer</span>
                <span className="font-bold text-slate-900">{selectedUser.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email</span>
                <span className="text-slate-700 truncate block">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Vehicle</span>
                <span className="font-mono font-bold text-slate-900">{selectedUser.vehicleNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Role</span>
                <Badge status={selectedUser.role} size="sm" />
              </div>
            </div>

            {/* Booking History Table */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">
                Booking History ({userBookings.length})
              </h4>
              {userBookings.length === 0 ? (
                <p className="text-slate-400 py-4 text-center">No bookings recorded for this user.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {userBookings.map((b) => (
                    <div key={b._id} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">
                          {b.bookingReference}
                        </span>
                        <span className="text-slate-500">
                          {b.slotId?.slotNumber} ({b.slotId?.area}) • {new Date(b.startTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="font-bold text-slate-900 block">PKR {b.amount?.toFixed(2)}</span>
                        <Badge status={b.bookingStatus} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
