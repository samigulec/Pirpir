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
  closeLabel = "Kapat",
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
  closeLabel?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Masaüstünde panel ekranın altına taşıyorsa sayfa, panel tamamen görünecek kadar kaydırılır
  // (telefonda panel zaten alttan açılan sayfa).
  useEffect(() => {
    if (!open || window.matchMedia("(max-width: 767px)").matches) return;
    const fit = () => {
      const box = panel.current?.getBoundingClientRect();
      if (!box) return;
      const overflow = box.bottom + 16 - window.innerHeight;
      // Yalnızca taşan kadar; panel ekrandan uzunsa üstü ekranda kalır
      if (overflow > 0) window.scrollBy({ top: Math.min(overflow, box.top - 16), behavior: "smooth" });
    };
    // İçerik sonradan uzayabilir (ör. takvim fiyatları gelince); boyut değişince yeniden bakılır
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(fit, 120);
    });
    if (panel.current) observer.observe(panel.current);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [open]);

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
        <>
          {/* Telefonda arka plan karartması; panel alttan açılır. */}
          <div aria-hidden="true" className="fixed inset-0 z-40 bg-ink/40 md:hidden" onClick={() => setOpen(false)} />
          <div
            ref={panel}
            id={`${id}-panel`}
            role="dialog"
            aria-label={label}
            className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col gap-3 overflow-y-auto rounded-t-[28px] bg-white p-5 pb-8 text-ink shadow-search md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-[calc(100%+8px)] md:max-h-none md:min-w-[260px] md:overflow-visible md:rounded-[24px] md:p-5 ${panelClassName}`}
          >
            <div className="flex items-center justify-between md:hidden">
              <span className="font-display text-xl font-semibold">{label}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-field text-ink"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {children(() => setOpen(false))}
          </div>
        </>
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
    "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-solid border-primary bg-white font-display text-xl font-semibold text-primary disabled:cursor-not-allowed disabled:border-line disabled:text-muted";
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex flex-col">
        <span className="font-extrabold">{label}</span>
        <span className="text-[13px] font-semibold text-muted">{hint}</span>
      </span>
      <span className="flex items-center gap-3">
        <button type="button" aria-label={`${label} −`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>−</button>
        <span aria-live="polite" className="w-6 text-center font-display text-xl font-semibold">{value}</span>
        <button type="button" aria-label={`${label} +`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>+</button>
      </span>
    </div>
  );
}
