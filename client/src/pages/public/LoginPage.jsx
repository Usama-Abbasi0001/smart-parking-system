import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setSubmitting(true);
    const result = await login(identifier, password);
    setSubmitting(false);

    if (result.success) {
      const destination = location.state?.from?.pathname || (result.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      navigate(destination, { replace: true });
    }
  };

  const handleQuickFill = (demoIdentifier, demoPassword) => {
    setIdentifier(demoIdentifier);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Car className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-2xl">
            Park<span className="text-blue-600">Pulse</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Sign in using your Car Number Plate or Email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Car Plate Number or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Car className="w-4 h-4 text-blue-600" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. KHI-7860 or usama@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Client / Driver apni <strong>Car ki Number Plate</strong> ya Email se login kar sakte hain.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
              ⚡ 1-Click Quick Demo Login
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('usamakhan58461@gmail.com', '2k22-cs-44')}
                className="group flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 hover:shadow-md border border-purple-200 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                <span>Admin (Usama)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('KHI-7860', 'Client1234!')}
                className="group flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:shadow-md border border-blue-200 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>Client (Plate: KHI-7860)</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
