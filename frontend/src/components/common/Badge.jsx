import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const variants = {
    // General
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    primary: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/50',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-700/50',
    danger: 'bg-rose-950/70 text-rose-300 border-rose-700/50',

    // Tasks Statuses
    BACKLOG: 'bg-slate-800/80 text-slate-400 border-slate-700',
    TODO: 'bg-blue-950/80 text-blue-300 border-blue-800/60',
    IN_PROGRESS: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
    IN_REVIEW: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
    DONE: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',

    // Priorities
    LOW: 'bg-slate-800/60 text-slate-400 border-slate-700',
    MEDIUM: 'bg-blue-950/60 text-blue-400 border-blue-800/50',
    HIGH: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
    URGENT: 'bg-rose-950/80 text-rose-300 border-rose-600/70 animate-pulse',

    // Roles
    OWNER: 'bg-purple-950/70 text-purple-300 border-purple-700/50 font-semibold',
    ADMIN: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/50',
    MEMBER: 'bg-slate-800 text-slate-300 border-slate-700',
    VIEWER: 'bg-slate-900 text-slate-400 border-slate-800',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 font-medium',
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
  };

  const styleClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.sm;

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wide uppercase ${styleClass} ${sizeClass} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
