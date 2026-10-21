import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car } from 'lucide-react';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/30 mb-4">
          <Car className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Connecting to ParkPulse...</p>
        <p className="text-xs text-slate-400 mt-1">Verifying session credentials</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
