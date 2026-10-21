import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ArrowLeft, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm">
        <Car className="w-8 h-8" />
      </div>
      <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
        404 Error
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
        Parking Bay Not Found
      </h1>
      <p className="text-slate-500 max-w-md mt-2 mb-8 text-sm leading-relaxed">
        The parking page or resource you are looking for has been moved, unlisted, or does not exist.
      </p>
      <div className="flex gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          Home Page
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          User Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
