import React, { forwardRef } from 'react';

export const Select = forwardRef(({
  label,
  error,
  options = [],
  children,
  className = '',
  id,
  required = false,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        required={required}
        className={`w-full rounded-xl bg-slate-900 border text-slate-100 text-sm py-2.5 px-3.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 ${
          error ? 'border-rose-500/70' : 'border-slate-800 hover:border-slate-700'
        } ${className}`}
        {...props}
      >
        {children ? (
          children
        ) : (
          options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
              {opt.label}
            </option>
          ))
        )}
      </select>

      {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
