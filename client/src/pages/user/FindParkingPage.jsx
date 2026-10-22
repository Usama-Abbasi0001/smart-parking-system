import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import {
  Car,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Zap,
  Shield,
  Check,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { GridSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const FindParkingPage = () => {
  const navigate = useNavigate();

  // Date and Time filter states (Default: today, next full hour to +2 hours)
  const now = new Date();
  const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const currentHour = now.getHours();
  const nextHour = (currentHour + 1) % 24;
  const plusTwoHour = (nextHour + 2) % 24;

  const defaultStartHour = String(nextHour).padStart(2, '0') + ':00';
  const defaultEndHour = String(plusTwoHour).padStart(2, '0') + ':00';

  const [date, setDate] = useState(localTodayStr);
  const [startTime, setStartTime] = useState(defaultStartHour);
  const [endTime, setEndTime] = useState(defaultEndHour);

  // Filter & Search states
  const [selectedArea, setSelectedArea] = useState('All');
  const [slotType, setSlotType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState(15);
  const [sortBy, setSortBy] = useState('slotNumber');
  const [order, setOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [slots, setSlots] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected slot for reservation modal
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Calculate if the reservation crosses midnight (overnight into next day)
  const isOvernight = useMemo(() => {
    if (!startTime || !endTime) return false;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;
    return endMins < startMins;
  }, [startTime, endTime]);

  // Construct ISO timestamps
  const startISO = useMemo(() => {
    if (!date || !startTime) return '';
    return new Date(`${date}T${startTime}:00`).toISOString();
  }, [date, startTime]);

  const endISO = useMemo(() => {
    if (!date || !endTime || !startTime) return '';
    const startObj = new Date(`${date}T${startTime}:00`);
    let endObj = new Date(`${date}T${endTime}:00`);

    // If end time is earlier than start time, it rolls over to next day (overnight booking)
    if (endObj < startObj) {
      endObj = new Date(endObj.getTime() + 24 * 60 * 60 * 1000);
    }
    return endObj.toISOString();
  }, [date, startTime, endTime]);

  // Duration in hours
  const durationHours = useMemo(() => {
    if (!startISO || !endISO || startTime === endTime) return 0;
    const s = new Date(startISO).getTime();
    const e = new Date(endISO).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return 0;
    return parseFloat(((e - s) / (1000 * 60 * 60)).toFixed(2));
  }, [startISO, endISO, startTime, endTime]);

  // Fetch areas on mount
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await api.get('/slots/areas');
        setAreas(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch areas:', err);
      }
    };
    fetchAreas();
  }, []);

  // Fetch slots whenever time window or primary filters change
  const fetchSlots = async () => {
    try {
      setLoading(true);
      const params = {
        startTime: startISO,
        endTime: endISO,
        area: selectedArea,
        slotType,
        sortBy,
        order,
      };

      const res = await api.get('/slots', { params });
      setSlots(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (durationHours > 0) {
      fetchSlots();
    }
  }, [date, startTime, endTime, selectedArea, slotType, sortBy, order]);

  // Client-side quick filter for search & price
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = slot.slotNumber.toLowerCase().includes(q);
        const matchesArea = slot.area.toLowerCase().includes(q);
        const matchesFloor = slot.floorOrZone.toLowerCase().includes(q);
        if (!matchesNumber && !matchesArea && !matchesFloor) return false;
      }
      if (slot.hourlyRate > maxPrice) return false;
      if (statusFilter !== 'all' && slot.currentStatus !== statusFilter) return false;
      return true;
    });
  }, [slots, searchQuery, maxPrice, statusFilter]);

  // Slot card background/border styles by status
  const getSlotCardStyle = (slot) => {
    if (selectedSlot?._id === slot._id) {
      return 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500 shadow-md';
    }
    switch (slot.currentStatus) {
      case 'available':
        return 'border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md';
      case 'occupied':
        return 'border-rose-200 bg-rose-50/30 opacity-90';
      case 'reserved':
        return 'border-amber-200 bg-amber-50/30';
      case 'maintenance':
      case 'inactive':
        return 'border-slate-200 bg-slate-50 opacity-70';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const handleSelectSlot = (slot) => {
    if (!slot.isAvailable) {
      if (slot.currentStatus === 'maintenance') {
        toast.error('This slot is currently under maintenance.');
      } else if (slot.currentStatus === 'occupied') {
        toast.error('This slot is already occupied during this time window.');
      } else {
        toast.error('This slot is currently unavailable for the chosen interval.');
      }
      return;
    }
    setSelectedSlot(slot);
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot) return;

    if (durationHours <= 0) {
      toast.error('End time must be after start time.');
      return;
    }

    try {
      setBookingLoading(true);
      const res = await api.post('/bookings', {
        slotId: selectedSlot._id,
        startTime: startISO,
        endTime: endISO,
      });

      const booking = res.data.data.booking;
      toast.success('Slot reserved! Proceeding to simulated payment...');
      setSelectedSlot(null);
      navigate(`/checkout/${booking._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      // Refresh slots to show real-time collision
      fetchSlots();
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Find & Reserve Parking
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time database availability check across all zones
          </p>
        </div>
      </div>

      {/* Date, Time & Search Bar Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Schedule Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Booking Date
            </label>
            <input
              type="date"
              value={date}
              min={localTodayStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                End Time
              </label>
              {isOvernight && (
                <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                  +1 Day (Overnight)
                </span>
              )}
            </div>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
            />
          </div>
        </div>

        {durationHours < 0.25 ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>End time must be at least 15 minutes after start time.</span>
          </div>
        ) : (
          <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Reservation duration: <strong className="font-bold">{durationHours} hours</strong>
                {isOvernight && <span className="ml-1.5 text-indigo-700 font-semibold">(Overnight schedule)</span>}
              </span>
            </div>
            <span className="text-[11px] text-blue-600 font-medium hidden sm:inline">
              Real-time slot availability active
            </span>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          {/* Search by keyword */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search slot (e.g. CP-101)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {/* Area Filter */}
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="All">All Parking Areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Slot Type */}
          <div>
            <select
              value={slotType}
              onChange={(e) => setSlotType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none capitalize"
            >
              <option value="all">All Vehicle Types</option>
              <option value="car">🚗 Car (PKR 5,000 / 2 hrs)</option>
              <option value="bike">🏍️ Bike (PKR 2,500 / 2 hrs)</option>
              <option value="cycle">🚲 Cycle (PKR 1,000 / 2 hrs)</option>
              <option value="standard">Standard</option>
              <option value="accessible">Accessible / Disability</option>
              <option value="ev_charging">EV Charging Hub</option>
              <option value="vip">VIP Executive</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">Only Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved / Pending</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sb, ord] = e.target.value.split('-');
                setSortBy(sb);
                setOrder(ord);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="slotNumber-asc">Slot Number (A-Z)</option>
              <option value="hourlyRate-asc">Price (Low to High)</option>
              <option value="hourlyRate-desc">Price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Status Legend */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
          Availability Legend:
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-medium text-slate-700">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
            <span className="font-medium text-slate-700">Occupied (Active)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
            <span className="font-medium text-slate-700">Reserved / Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
            <span className="font-medium text-slate-700">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm" />
            <span className="font-medium text-slate-700">Maintenance / Off</span>
          </div>
        </div>
      </div>

      {/* Slot Grid */}
      {loading ? (
        <GridSkeleton count={10} />
      ) : filteredSlots.length === 0 ? (
        <EmptyState
          title="No parking slots found"
          description="Try broadening your search filters or selecting a different time window."
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedArea('All');
            setSlotType('all');
            setStatusFilter('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSlots.map((slot) => {
            const cardStyle = getSlotCardStyle(slot);
            const isSelected = selectedSlot?._id === slot._id;

            return (
              <div
                key={slot._id}
                onClick={() => handleSelectSlot(slot)}
                className={`group rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98] animate-fade-in ${cardStyle}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                        {slot.slotNumber}
                      </span>
                      {slot.isAvailable && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 glow-emerald" />
                      )}
                    </div>
                    <Badge status={slot.currentStatus} size="sm" />
                  </div>

                  <p className="text-xs font-semibold text-slate-700 mt-1.5">
                    {slot.area}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {slot.floorOrZone} • <span className="capitalize">{slot.slotType.replace('_', ' ')}</span>
                  </p>

                  {slot.description && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-1 italic bg-slate-50/80 px-2 py-1 rounded-lg">
                      "{slot.description}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Hourly Rate
                    </span>
                    <span className="text-base font-black text-slate-900">
                      PKR {slot.hourlyRate.toFixed(2)}
                      <span className="text-[10px] text-slate-400 font-normal">/hr</span>
                    </span>
                  </div>

                  {slot.isAvailable ? (
                    <button
                      type="button"
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-blue-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 group-hover:scale-105'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Book Now'}
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 capitalize">
                      {slot.currentStatus}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservation Confirmation Drawer / Modal */}
      <Modal
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        title="Confirm Parking Reservation"
        maxWidth="max-w-md"
      >
        {selectedSlot && (
          <div className="space-y-4 text-xs">
            {/* Slot summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Parking Bay</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {selectedSlot.slotNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Area & Zone</span>
                <span className="font-semibold text-slate-800">
                  {selectedSlot.area} ({selectedSlot.floorOrZone})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Slot Type</span>
                <span className="capitalize font-medium text-slate-800">
                  {selectedSlot.slotType.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Time interval & price calculation */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Date</span>
                <span className="font-semibold text-blue-950">{date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Reserved Window</span>
                <span className="font-semibold text-blue-950">
                  {startTime} to {endTime} ({durationHours} hours {isOvernight ? '• Next Day' : ''})
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="font-bold text-blue-900 text-sm">Estimated Total</span>
                <span className="font-black text-blue-950 text-lg">
                  PKR {Math.max(1, (durationHours * selectedSlot.hourlyRate)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-700 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Reservation Rules
              </div>
              <p>• Your slot will be held for 15 minutes to complete simulated checkout.</p>
              <p>• Overbooking is strictly prevented by real-time concurrency locks.</p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bookingLoading}
                onClick={handleCreateBooking}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {bookingLoading ? 'Reserving...' : 'Proceed to Pay'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FindParkingPage;
