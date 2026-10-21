import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../services/api';
import {
  SlidersHorizontal,
  Plus,
  Search,
  Filter,
  Edit,
  Power,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Car,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

const AdminSlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    slotNumber: '',
    area: '',
    floorOrZone: '',
    hourlyRate: 5.0,
    slotType: 'standard',
    description: '',
  });

  const fetchSlots = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/slots', {
        params: {
          page,
          limit: 10,
          search,
          area: areaFilter,
          status: statusFilter,
        },
      });
      setSlots(res.data.data.slots || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots(1);
  }, [areaFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSlots(1);
  };

  const handleOpenAdd = () => {
    setFormData({
      slotNumber: '',
      area: '',
      floorOrZone: '',
      hourlyRate: 5.0,
      slotType: 'standard',
      description: '',
    });
    setEditingSlot(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (slot) => {
    setEditingSlot(slot);
    setFormData({
      slotNumber: slot.slotNumber,
      area: slot.area,
      floorOrZone: slot.floorOrZone,
      hourlyRate: slot.hourlyRate,
      slotType: slot.slotType,
      description: slot.description || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitSlot = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      if (editingSlot) {
        await api.patch(`/admin/slots/${editingSlot._id}`, formData);
        toast.success(`Slot ${formData.slotNumber} updated successfully!`);
      } else {
        await api.post('/admin/slots', formData);
        toast.success(`Slot ${formData.slotNumber} created successfully!`);
      }
      setIsAddModalOpen(false);
      setEditingSlot(null);
      fetchSlots(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (slot, field) => {
    try {
      const payload = {};
      if (field === 'active') payload.active = !slot.active;
      if (field === 'maintenance') payload.maintenanceStatus = !slot.maintenanceStatus;

      await api.patch(`/admin/slots/${slot._id}/status`, payload);
      toast.success(`Slot ${slot.slotNumber} status updated.`);
      fetchSlots(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Parking Bay Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure slots, hourly rates, zones, and maintenance states
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Parking Slot
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search slot number or floor/zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="all">All Operational Statuses</option>
            <option value="active">Active & Operational</option>
            <option value="inactive">Deactivated</option>
            <option value="maintenance">Under Maintenance</option>
          </select>

          <button
            onClick={() => fetchSlots(1)}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Slots Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : slots.length === 0 ? (
        <EmptyState
          title="No parking slots found"
          description="Create your first parking slot or adjust search filters."
          actionLabel="Add Parking Slot"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Slot Number</th>
                  <th className="px-6 py-3.5">Area & Floor</th>
                  <th className="px-6 py-3.5">Slot Type</th>
                  <th className="px-6 py-3.5">Hourly Rate</th>
                  <th className="px-6 py-3.5">State</th>
                  <th className="px-6 py-3.5 text-right">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {slots.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-sm">
                      {s.slotNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 block">{s.area}</span>
                      <span className="text-slate-400 text-[11px]">{s.floorOrZone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={s.slotType} text={s.slotType.replace('_', ' ')} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${s.hourlyRate.toFixed(2)}/hr
                    </td>
                    <td className="px-6 py-4 space-x-1">
                      {s.maintenanceStatus ? (
                        <Badge status="maintenance" text="Maintenance" size="sm" />
                      ) : s.active ? (
                        <Badge status="available" text="Active" size="sm" />
                      ) : (
                        <Badge status="inactive" text="Deactivated" size="sm" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit slot"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(s, 'maintenance')}
                          title={s.maintenanceStatus ? 'Clear maintenance' : 'Put under maintenance'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            s.maintenanceStatus
                              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          <Wrench className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(s, 'active')}
                          title={s.active ? 'Deactivate slot' : 'Activate slot'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            s.active
                              ? 'text-emerald-600 hover:bg-rose-50 hover:text-rose-600'
                              : 'text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100 p-4 space-y-3">
            {slots.map((s) => (
              <div key={s._id} className="pt-3 first:pt-0 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-black text-base text-slate-900 block">
                      {s.slotNumber}
                    </span>
                    <span className="text-xs text-slate-600 font-semibold">
                      {s.area} • {s.floorOrZone}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">
                      ${s.hourlyRate.toFixed(2)}/hr
                    </span>
                    <Badge status={s.slotType} text={s.slotType.replace('_', ' ')} size="sm" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {s.maintenanceStatus ? (
                      <Badge status="maintenance" text="Maintenance" size="sm" />
                    ) : s.active ? (
                      <Badge status="available" text="Active" size="sm" />
                    ) : (
                      <Badge status="inactive" text="Deactivated" size="sm" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="px-2.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(s, 'maintenance')}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 active:scale-95 ${
                        s.maintenanceStatus
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      {s.maintenanceStatus ? 'Under Repair' : 'Repair'}
                    </button>
                    <button
                      onClick={() => handleToggleStatus(s, 'active')}
                      className={`p-1.5 rounded-lg text-xs font-semibold active:scale-95 ${
                        s.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(page) => fetchSlots(page)}
          />
        </div>
      )}

      {/* Add / Edit Slot Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSlot(null);
        }}
        title={editingSlot ? `Edit Slot ${editingSlot.slotNumber}` : 'Create New Parking Slot'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitSlot} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Slot Identifier / Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CP-101, T1-A05"
              value={formData.slotNumber}
              onChange={(e) => setFormData({ ...formData, slotNumber: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl uppercase font-mono font-bold focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Parking Area
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Central Plaza Deck"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Floor or Zone
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Floor 1, Zone B"
                value={formData.floorOrZone}
                onChange={(e) => setFormData({ ...formData, floorOrZone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Slot Type
              </label>
              <select
                value={formData.slotType}
                onChange={(e) => setFormData({ ...formData, slotType: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="standard">Standard</option>
                <option value="accessible">Accessible / Disabled</option>
                <option value="ev_charging">EV Fast Charging</option>
                <option value="compact">Compact Cars</option>
                <option value="vip">VIP Executive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Wide bay next to elevator lobby"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div className="pt-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSlotsPage;
