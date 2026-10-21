import React from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  ShieldCheck,
  Zap,
  QrCode,
  ArrowRight,
  CheckCircle,
  BarChart,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-xl">
                Park<span className="text-blue-600">Pulse</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                FYP Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Final Year Project — Software-Only Smart Parking System
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Intelligent Parking Management for Modern Cities
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
              Find, reserve, and manage parking slots in real time. Features conflict-free
              database scheduling, demo payment simulation, QR check-ins, and full administrative analytics.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/find-parking' : '/register'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 transition-all"
              >
                Find & Book Parking
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all"
              >
                Sign In to Account
              </Link>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm card-interactive hover:-translate-y-2 hover:shadow-xl transition-all duration-300 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Zero Overbooking Guarantee</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Server-side interval overlap calculations and database concurrency isolation prevent two drivers
                from ever reserving the same parking bay simultaneously.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm card-interactive hover:-translate-y-2 hover:shadow-xl transition-all duration-300 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Simulated Demo Checkout</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Test realistic payment workflows, instant transaction logging, state transitions,
                and simulated automated refund processing safely without real money.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm card-interactive hover:-translate-y-2 hover:shadow-xl transition-all duration-300 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Secure Digital QR Receipts</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Automatic generation of secure verification QR codes for contactless check-in,
                complete booking receipts, and live validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 ParkPulse — Smart Parking System. Final Year Project.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-blue-600">Admin Portal</Link>
            <Link to="/find-parking" className="hover:text-blue-600">Live Slots</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
