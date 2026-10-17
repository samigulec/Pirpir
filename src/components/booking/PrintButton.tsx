"use client";

/** Tarayıcının yazdırma penceresi: "PDF olarak kaydet" de buradan seçilir. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-[48px] cursor-pointer rounded-pill border-0 bg-primary px-6 py-3 font-display text-lg font-semibold leading-[normal] text-white print:hidden"
    >
      {label}
    </button>
  );
}
