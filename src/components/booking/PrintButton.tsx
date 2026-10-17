"use client";

/** Tarayıcının yazdırma penceresi: "PDF olarak kaydet" de buradan seçilir. */
export function PrintButton({ label, tone = "primary" }: { label: string; tone?: "primary" | "soft" }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`min-h-[48px] cursor-pointer rounded-pill border-0 px-6 py-3 font-display text-lg font-semibold leading-[normal] print:hidden ${
        tone === "primary" ? "bg-primary text-white" : "bg-field text-ink"
      }`}
    >
      {label}
    </button>
  );
}
