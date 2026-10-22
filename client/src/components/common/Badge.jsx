import React from 'react';

const Badge = ({ status, text, size = 'md' }) => {
  const norm = (status || text || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  let isOnlineBadge = false;

  if (['available', 'active', 'paid', 'success', 'online'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
    if (norm === 'online') isOnlineBadge = true;
  } else if (['occupied', 'deactivated', 'failed'].includes(norm)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (['reserved', 'pending', 'pending_payment', 'warning'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (['confirmed', 'selected', 'standard'].includes(norm)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  } else if (['completed'].includes(norm)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500';
  } else if (['offline', 'cancelled', 'maintenance', 'inactive'].includes(norm)) {
    styles = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
  } else if (['refunded'].includes(norm)) {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
    dotColor = 'bg-purple-500';
  } else if (['ev_charging'].includes(norm)) {
    styles = 'bg-teal-50 text-teal-700 border-teal-200';
    dotColor = 'bg-teal-500';
  } else if (['vip'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
    dotColor = 'bg-amber-600';
  } else if (['car'].includes(norm)) {
    styles = 'bg-blue-50 text-blue-800 border-blue-200 font-semibold';
    dotColor = 'bg-blue-600';
  } else if (['bike'].includes(norm)) {
    styles = 'bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold';
    dotColor = 'bg-cyan-600';
  } else if (['cycle'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
    dotColor = 'bg-emerald-600';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  // Format display label
  const label = text || status?.replace(/_/g, ' ') || 'Unknown';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles} ${sizeClasses} capitalize transition-colors`}
    >
      {isOnlineBadge ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      )}
      {label}
    </span>
  );
};

export default Badge;
