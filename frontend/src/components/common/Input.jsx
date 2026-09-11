import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  required = false,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`w-full rounded-xl bg-slate-900/90 border text-slate-100 text-sm placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 py-2.5 ${
            Icon ? 'pl-10 pr-3.5' : 'px-3.5'
          } ${
            error ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/40' : 'border-slate-800 hover:border-slate-700'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-400 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
