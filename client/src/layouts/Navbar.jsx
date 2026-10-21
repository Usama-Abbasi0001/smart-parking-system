import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  Bell,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Download,
  Smartphone,
  Laptop,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Badge from '../components/common/Badge';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if launched as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden active:scale-95 transition-all"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-slate-800 rotate-90 transition-transform" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>

            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Car className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 tracking-tight leading-none text-lg">
                    Park<span className="text-blue-600">Pulse</span>
                  </span>
                  {isAdmin ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 shadow-sm animate-pulse">
                      Admin
                    </span>
                  ) : (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      Driver
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-semibold text-slate-400 tracking-widest uppercase">
                  Smart Parking System
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install App as Desktop/Mobile PWA button */}
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                title="Install as Desktop or Mobile App"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 hover:border-emerald-300 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden text-[10px]">App</span>
              </button>
            )}

            {/* Quick Find Parking CTA */}
            <Link
              to="/find-parking"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 hover:shadow-sm active:scale-95 transition-all"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Find Bay</span>
            </Link>

            {/* In-App Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-[-45px] sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-scale-in">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => !n.read && markAsRead(n._id)}
                          className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                            !n.read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {n.type === 'payment' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : n.type === 'cancellation' ? (
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-800 leading-snug">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                    isAdmin
                      ? 'bg-purple-700 ring-2 ring-purple-400'
                      : 'bg-slate-900 ring-2 ring-blue-500'
                  }`}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {user?.role} • {user?.vehicleNumber}
                  </span>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge status={user?.role} text={user?.role} size="sm" />
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {user?.vehicleNumber}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    My Profile & Vehicle
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-purple-600 animate-pulse" />
                      Admin Console
                    </Link>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Install App Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-in">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Install ParkPulse</h3>
                <p className="text-xs text-slate-500">Fast, Standalone Mobile & Desktop App</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 mb-6">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <Laptop className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Chrome / Edge (PC & Laptop)</span>
                  Browser URL bar ke right corner mein <strong>Install (💻)</strong> icon par click karein ya browser menu (⋮) se <strong>Install ParkPulse</strong> select karein.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <Smartphone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Android (Chrome / Samsung)</span>
                  Chrome ke 3 dots (⋮) par tap karein aur <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> par tap karein.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <Share2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block text-xs">iPhone / iPad (Safari)</span>
                  Safari ke bottom mein <strong>Share</strong> icon (arrow wala box) par tap karein aur <strong>"Add to Home Screen"</strong> dabayein.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
            >
              Samajh Gaya (Done)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
