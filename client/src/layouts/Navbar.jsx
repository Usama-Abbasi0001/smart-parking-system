import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Menu,
  X,
  Download,
  Smartphone,
  Laptop,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { isAdmin } = useAuth();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

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
