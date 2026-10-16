"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Arama kutusundaki alan + açılır panel. Dışarı tıklayınca ya da Escape ile kapanır. */
export function FieldPopover({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
  children,
  panelClassName = "",
  chevron = false,
}: {
  label: string;
  value: string;
  className: string;
  labelClassName: string;
  valueClassName: string;
  children: (close: () => void) => React.ReactNode;
  panelClassName?: string;
  /** Tasarımdaki açılır liste oku. */
  chevron?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(!open)}
        className={`${className} w-full cursor-pointer border-0 text-left`}
      >
        <span className={labelClassName}>{label}</span>
        <span className="flex w-full items-center justify-between gap-2">
          <span className={`${valueClassName} truncate`}>{value}</span>
          {chevron && (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mr-[2px] flex-none">
              <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>
      {open && (
        <div
          id={`${id}-panel`}
          role="dialog"
          aria-label={label}
          className={`absolute left-0 top-[calc(100%+6px)] z-30 flex min-w-[260px] flex-col gap-3 rounded-[20px] bg-white p-4 text-ink shadow-search ${panelClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const btn =
    "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-field font-display text-xl font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex flex-col">
        <span className="font-extrabold">{label}</span>
        <span className="text-[13px] font-semibold text-muted">{hint}</span>
      </span>
      <span className="flex items-center gap-3">
        <button type="button" aria-label={`${label} −`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>−</button>
        <span aria-live="polite" className="w-5 text-center font-display text-lg font-semibold">{value}</span>
        <button type="button" aria-label={`${label} +`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>+</button>
      </span>
    </div>
  );
}
