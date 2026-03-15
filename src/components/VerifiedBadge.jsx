'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Blue verified tick with an interactive tooltip.
 * Appears on hover (desktop) or tap (mobile).
 *
 * @param {string} name  - Author display name
 * @param {string} role  - Author role string
 * @param {'sm'|'md'|'lg'} size - Icon size variant
 */
export default function VerifiedBadge({ name, role, size = 'md' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click (mobile tap-away)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(v => !v)}
      role="button"
      tabIndex={0}
      aria-label={`${name} is a verified ${role} at OpenTuwa`}
      onKeyDown={(e) => e.key === 'Enter' && setOpen(v => !v)}
    >
      {/* Badge icon */}
      <svg
        className={`${iconSize} flex-shrink-0 cursor-pointer select-none`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
        <path d="M9.5 12.5L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Tooltip */}
      {open && (
        <span
          role="tooltip"
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50
            w-56 rounded-xl
            bg-[rgba(15,15,20,0.96)] border border-white/10
            shadow-[0_8px_32px_rgba(0,0,0,0.6)]
            backdrop-blur-xl
            px-4 py-3
            pointer-events-none
            animate-fade-in
          "
        >
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white/10" />

          <span className="flex items-center gap-2 mb-1.5">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
              <path d="M9.5 12.5L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-white text-xs font-semibold">Verified by OpenTuwa</span>
          </span>

          <p className="text-white/60 text-[11px] leading-relaxed">
            <span className="text-white font-medium">{name}</span> is a verified{' '}
            <span className="text-[#1D9BF0]">{role}</span> at OpenTuwa — a recognised member of the editorial team.
          </p>
        </span>
      )}
    </span>
  );
}
