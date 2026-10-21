import React from 'react';

const colorVariants = {
  blue: {
    bg: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
    hover: 'hover:border-blue-300',
    iconBg: 'bg-blue-600 text-white shadow-blue-500/20',
  },
  emerald: {
    bg: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100',
    hover: 'hover:border-emerald-300',
    iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
  },
  rose: {
    bg: 'bg-rose-50 text-rose-600',
    border: 'border-rose-100',
    hover: 'hover:border-rose-300',
    iconBg: 'bg-rose-600 text-white shadow-rose-500/20',
  },
  amber: {
    bg: 'bg-amber-50 text-amber-600',
    border: 'border-amber-100',
    hover: 'hover:border-amber-300',
    iconBg: 'bg-amber-500 text-white shadow-amber-500/20',
  },
  purple: {
    bg: 'bg-purple-50 text-purple-600',
    border: 'border-purple-100',
    hover: 'hover:border-purple-300',
    iconBg: 'bg-purple-600 text-white shadow-purple-500/20',
  },
  indigo: {
    bg: 'bg-indigo-50 text-indigo-600',
    border: 'border-indigo-100',
    hover: 'hover:border-indigo-300',
    iconBg: 'bg-indigo-600 text-white shadow-indigo-500/20',
  },
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  onClick,
}) => {
  const scheme = colorVariants[color] || colorVariants.blue;

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-2xl p-4 sm:p-5 border ${scheme.border} shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        onClick ? 'cursor-pointer ' + scheme.hover : ''
      } active:scale-[0.98] animate-fade-in`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 truncate">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight truncate">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`p-3 rounded-2xl ${scheme.iconBg} shadow-md flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
