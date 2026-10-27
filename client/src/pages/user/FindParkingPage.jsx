import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import {
  Car,
  Bike,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { GridSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const DEFAULT_AREAS = [
  'Boulevard Mall',
  'Abdullah Mall',
  'Chase Value',
  'Mehran Walk',
];

const VEHICLE_CONFIGS = {
  car: {
    type: 'car',
    title: 'Car Parking',
    subtitle: 'Sedans, SUVs, Hatchbacks & Jeeps',
    hourlyRate: 2500,
    rateFor2Hours: 5000,
    icon: Car,
    color: 'blue',
    gradient: 'from-blue-600 to-indigo-700',
    borderStyle: 'border-blue-200 hover:border-blue-500 hover:shadow-blue-500/10',
    lightBg: 'bg-blue-50/50',
    badgeText: 'Car Bay',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    features: [
      'Wide bay with automatic proximity sensors',
      '24/7 guarded and CCTV covered deck',
      'Direct elevator access to shopping levels',
    ],
  },
  bike: {
    type: 'bike',
    title: 'Bike Parking (Motorcycle)',
    subtitle: 'Heavy Bikes, Scooters & Motorbikes',
    hourlyRate: 1250,
    rateFor2Hours: 2500,
    icon: Bike,
    color: 'cyan',
    gradient: 'from-cyan-600 to-blue-600',
    borderStyle: 'border-cyan-200 hover:border-cyan-500 hover:shadow-cyan-500/10',
    lightBg: 'bg-cyan-50/50',
    badgeText: 'Motorbike Bay',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    features: [
      'Heavy-duty ground chain anchor locks',
      'Covered weatherproof shaded parking',
      'Dedicated two-wheeler security guard',
    ],
  },
  cycle: {
    type: 'cycle',
    title: 'Cycle Parking (Bicycle)',
    subtitle: 'Sports Bicycles & Commuter Cycles',
    hourlyRate: 500,
    rateFor2Hours: 1000,
    icon: Bike,
    color: 'emerald',
    gradient: 'from-emerald-600 to-teal-700',
    borderStyle: 'border-emerald-200 hover:border-emerald-500 hover:shadow-emerald-500/10',
    lightBg: 'bg-emerald-50/50',
    badgeText: 'Cycle Stand',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    features: [
      'Dual-wheel steel frame mount and lock bar',
      'Sheltered eco-station near main gates',
      'Quick direct access to pedestrian walkways',
    ],
  },
};

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
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [slots, setSlots] = useState([]);
  const [areas, setAreas] = useState(DEFAULT_AREAS);
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

    if (endObj < startObj) {
      endObj = new Date(endObj.getTime() + 24 * 60 * 60 * 1000);
    }
    return endObj.toISOString();
  }, [date, startTime, endTime]);

  // Duration in hours
  const durationHours = useMemo(() => {
    if (!startISO || !endISO || startTime === endTime) return 2;
    const s = new Date(startISO).getTime();
    const e = new Date(endISO).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return 2;
    return parseFloat(((e - s) / (1000 * 60 * 60)).toFixed(2));
  }, [startISO, endISO, startTime, endTime]);

  // Fetch areas on mount
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await api.get('/slots/areas');
        if (res.data?.data && res.data.data.length > 0) {
          setAreas(res.data.data);
        } else {
          setAreas(DEFAULT_AREAS);
        }
      } catch (err) {
        setAreas(DEFAULT_AREAS);
      }
    };
    fetchAreas();
  }, []);

  // Fetch all slots from server
  const fetchSlots = async () => {
    try {
      setLoading(true);
      const params = {
        startTime: startISO,
        endTime: endISO,
        area: selectedArea,
        status: statusFilter !== 'all' ? statusFilter : undefined,
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
  }, [date, startTime, endTime, selectedArea, statusFilter]);

  // Calculate vehicle counts and available bays
  const vehicleCardsData = useMemo(() => {
    const targetAreas = selectedArea === 'All' ? areas : [selectedArea];

    // Filter slots based on selected area & search keyword
    const areaFilteredSlots = slots.filter((slot) => {
      if (selectedArea !== 'All' && slot.area !== selectedArea) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesArea = slot.area.toLowerCase().includes(q);
        const matchesFloor = slot.floorOrZone.toLowerCase().includes(q);
        const matchesType = slot.slotType.toLowerCase().includes(q);
        if (!matchesArea && !matchesFloor && !matchesType) return false;
      }
      return true;
    });

    const types = ['car', 'bike', 'cycle'];

    return types
      .filter((type) => {
        if (slotType !== 'all' && slotType !== type) return false;
        return true;
      })
      .map((type) => {
        const config = VEHICLE_CONFIGS[type];
        const ofType = areaFilteredSlots.filter((s) => s.slotType === type);

        const availableSlots = ofType.filter(
          (s) => s.isAvailable && s.currentStatus === 'available'
        );
        const occupiedCount = ofType.filter(
          (s) => s.currentStatus === 'occupied'
        ).length;
        const reservedCount = ofType.filter(
          (s) => s.currentStatus === 'reserved'
        ).length;
        const maintenanceCount = ofType.filter(
          (s) => s.currentStatus === 'maintenance'
        ).length;

        // Calculate dynamic total price for the selected hours
        const computedAmount = Math.max(
          100,
          Math.round(durationHours * config.hourlyRate)
        );

        return {
          ...config,
          totalCount: ofType.length,
          availableCount: availableSlots.length,
          occupiedCount,
          reservedCount,
          maintenanceCount,
          availableSlots,
          allSlots: ofType,
          computedAmount,
        };
      })
      .filter((item) => {
        if (statusFilter === 'available' && item.availableCount === 0) return false;
        if (statusFilter === 'occupied' && item.occupiedCount === 0) return false;
        if (statusFilter === 'reserved' && item.reservedCount === 0) return false;
        if (statusFilter === 'maintenance' && item.maintenanceCount === 0) return false;
        return true;
      });
  }, [slots, selectedArea, slotType, statusFilter, searchQuery, areas, durationHours]);

  // Trigger booking for a vehicle category
  const handleBookVehicleType = (vehicleCard) => {
    if (vehicleCard.availableCount === 0 || vehicleCard.availableSlots.length === 0) {
      toast.error(`No ${vehicleCard.title} slots are available for this time window.`);
      return;
    }
    // Select first available slot
    const slotToBook = vehicleCard.availableSlots[0];
    setSelectedSlot(slotToBook);
  };

  // Confirm reservation
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
      toast.success('Parking reserved successfully! Proceeding to checkout...');
      setSelectedSlot(null);
      navigate(`/checkout/${booking._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      fetchSlots();
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            Find & Reserve Parking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time live parking availability across Boulevard Mall, Abdullah Mall, Chase Value & Mehran Walk
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-800 self-start md:self-auto">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Instant Automated Boom Barrier Pass</span>
        </div>
      </div>

      {/* Primary Filter Bar: Date & Time Picker */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none font-medium"
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
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none font-medium"
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
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none font-medium"
            />
          </div>
        </div>

        {durationHours < 0.25 ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>End time must be at least 15 minutes after start time.</span>
          </div>
        ) : (
          <div className="p-3 bg-blue-50/80 border border-blue-200/90 rounded-2xl text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Reservation duration: <strong className="font-bold">{durationHours} hours</strong>
                {isOvernight && <span className="ml-1.5 text-indigo-700 font-semibold">(Overnight schedule)</span>}
              </span>
            </div>
            <span className="text-[11px] text-blue-700 font-bold hidden sm:inline">
              ✓ Concurrency-locked Real-Time Availability
            </span>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Search by keyword */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search area, mall, or zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium"
            />
          </div>

          {/* Area Filter */}
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-800 cursor-pointer"
            >
              <option value="All">All Parking Areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  📍 {a}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Type */}
          <div>
            <select
              value={slotType}
              onChange={(e) => setSlotType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-800 cursor-pointer"
            >
              <option value="all">All Vehicle Types (Car, Bike, Cycle)</option>
              <option value="car">🚗 Car (PKR 5,000 / 2 hrs)</option>
              <option value="bike">🏍️ Bike (PKR 2,500 / 2 hrs)</option>
              <option value="cycle">🚲 Cycle (PKR 1,000 / 2 hrs)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-800 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="available">Only Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved / Pending</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Status Legend & Areas Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Selected Location:
          </span>
          <span className="bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2.5 py-1 rounded-lg">
            📍 {selectedArea === 'All' ? 'All 4 Malls Active' : selectedArea}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-semibold text-slate-700">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
            <span className="font-semibold text-slate-700">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
            <span className="font-semibold text-slate-700">Reserved</span>
          </div>
        </div>
      </div>

      {/* Vehicle Category Parking Cards Section */}
      {loading ? (
        <GridSkeleton count={3} />
      ) : vehicleCardsData.length === 0 ? (
        <EmptyState
          title="No parking slots found"
          description="Try selecting a different area or resetting the filters."
          actionLabel="Reset to All Areas"
          onAction={() => {
            setSelectedArea('All');
            setSlotType('all');
            setStatusFilter('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vehicleCardsData.map((vc) => {
            const Icon = vc.icon;
            const isAvailable = vc.availableCount > 0;

            return (
              <div
                key={vc.type}
                className={`bg-white rounded-3xl border-2 transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden ${vc.borderStyle}`}
              >
                <div>
                  {/* Card Header Banner */}
                  <div className={`p-6 bg-gradient-to-r ${vc.gradient} text-white relative`}>
                    <div className="flex items-start justify-between">
                      <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {vc.badgeText}
                      </span>
                    </div>

                    <h3 className="text-xl font-black mt-4 tracking-tight">
                      {vc.title}
                    </h3>
                    <p className="text-xs text-white/80 font-medium mt-0.5">
                      {vc.subtitle}
                    </p>
                  </div>

                  {/* Card Content & Availability Counts */}
                  <div className="p-6 space-y-5">
                    {/* Real-time Available Bays Counter */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Active Availability
                        </span>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isAvailable ? '✓ Open for Booking' : '✗ Fully Occupied'}
                        </span>
                      </div>

                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">
                          {vc.availableCount}
                        </span>
                        <span className="text-sm font-bold text-slate-400">
                          / {vc.totalCount} Bays Available
                        </span>
                      </div>

                      {/* Mini Breakdown Badges */}
                      <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                          {vc.availableCount} Vacant
                        </span>
                        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-semibold border border-rose-200">
                          {vc.occupiedCount} Occupied
                        </span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200">
                          {vc.reservedCount} Reserved
                        </span>
                      </div>
                    </div>

                    {/* Pricing Display */}
                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Total Rate ({durationHours} hrs)
                        </span>
                        <span className="text-2xl font-black text-white">
                          PKR {vc.computedAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Standard Base
                        </span>
                        <span className="text-xs font-bold text-blue-300">
                          PKR {vc.hourlyRate.toLocaleString()} / hr
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Included Amenities
                      </span>
                      {vc.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleBookVehicleType(vc)}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isAvailable
                        ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl active:scale-[0.98]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <span>
                      {isAvailable
                        ? `Book ${vc.title} (PKR ${vc.computedAmount.toLocaleString()})`
                        : 'Currently Fully Booked'}
                    </span>
                    {isAvailable && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservation Confirmation Modal */}
      <Modal
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        title="Confirm Parking Reservation"
        maxWidth="max-w-md"
      >
        {selectedSlot && (
          <div className="space-y-4 text-xs">
            {/* Slot summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Assigned Bay</span>
                <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                  {selectedSlot.slotNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Location / Mall</span>
                <span className="font-bold text-slate-900">
                  {selectedSlot.area}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Floor / Zone</span>
                <span className="font-semibold text-slate-800">
                  {selectedSlot.floorOrZone}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Vehicle Category</span>
                <span className="capitalize font-bold text-slate-800">
                  {selectedSlot.slotType} Parking
                </span>
              </div>
            </div>

            {/* Time interval & price calculation */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Booking Date</span>
                <span className="font-bold text-blue-950">{date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Reserved Window</span>
                <span className="font-bold text-blue-950">
                  {startTime} to {endTime} ({durationHours} hours {isOvernight ? '• Next Day' : ''})
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="font-black text-blue-900 text-sm">Total Due</span>
                <span className="font-black text-blue-950 text-xl">
                  PKR {Math.round(durationHours * selectedSlot.hourlyRate).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Smart Parking Notice</span>
              </div>
              <p>• Your parking slot will be reserved immediately upon clicking proceed.</p>
              <p>• You will receive an instant digital QR Code pass for boom barrier entry.</p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="w-1/2 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bookingLoading}
                onClick={handleCreateBooking}
                className="w-1/2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
