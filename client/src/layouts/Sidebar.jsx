import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  User,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  BookOpen,
  FileSpreadsheet,
  Info,
  X,
  Car,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose?.();
    await logout();
    navigate('/login');
  };

  const userLinks = isAdmin
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/find-parking', label: 'Find Parking', icon: MapPin },
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/find-parking', label: 'Find Parking', icon: MapPin },
        { to: '/my-bookings', label: 'My Bookings', icon: CalendarCheck },
        { to: '/profile', label: 'Profile & Vehicle', icon: User },
      ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Overview', icon: ShieldAlert },
    { to: '/admin/slots', label: 'Parking Slots', icon: SlidersHorizontal },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/bookings', label: 'All Bookings', icon: BookOpen },
    { to: '/admin/reports', label: 'Reports & Export', icon: FileSpreadsheet },
  ];

  const userNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-98 ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  const adminNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-98 ${
      isActive
        ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-500/25'
        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50/70'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-16 bottom-0 left-0 z-50 lg:z-20 w-64 h-full lg:h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-transform duration-300 ease-out flex flex-col justify-between shadow-2xl lg:shadow-none shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Mobile Drawer Header with Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Car className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 text-base">
                Park<span className="text-blue-600">Pulse</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Navigation */}
          <div>
            <div className="px-3 flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isAdmin ? 'Account Navigation' : 'Driver Navigation'}
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <nav className="space-y-1">
              {userLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={userNavLinkClass}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin Navigation */}
          {isAdmin && (
            <div className="pt-2">
              <div className="px-3 flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  Admin Console
                </span>
                <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.5 rounded">
                  Root
                </span>
              </div>
              <nav className="space-y-1">
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={onClose}
                      className={adminNavLinkClass}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Profile ID Card at Bottom of Sidebar */}
        <div className="p-3 border-t border-slate-200/90 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
              title="View Profile"
            >
              <div
                className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 transition-transform group-hover:scale-105 ${
                  isAdmin
                    ? 'bg-purple-700 ring-2 ring-purple-300'
                    : 'bg-gradient-to-tr from-blue-700 to-indigo-600 ring-2 ring-blue-200'
                }`}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate capitalize">
                  {user?.role === 'admin' ? 'Admin' : 'Driver'} • {user?.vehicleNumber || (isAdmin ? 'ADMIN-001' : 'N/A')}
                </p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
