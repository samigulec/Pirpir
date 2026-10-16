// Arayüz simgeleri (dekoratif, aria-hidden).
type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const ArrowRight = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth="2.6" className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const SwapHorizontal = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth="2.6" className={className}><path d="M4 7h16M20 7l-3-3M20 7l-3 3" /><path d="M20 17H4M4 17l3-3M4 17l3 3" /></svg>
);
export const SwapVertical = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth="2.6" className={className}><path d="M7 4v16M7 20l-3-3M7 20l3-3" /><path d="M17 20V4M17 4l-3 3M17 4l3 3" /></svg>
);
export const Lock = ({ size = 20, className, strokeWidth = 2.4 }: P & { strokeWidth?: number }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const Check = ({ size = 20, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><path d="M5 12l5 5L20 7" /></svg>
);
export const Headset = ({ size = 20, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><path d="M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1v-6h3M4 13v4a2 2 0 0 0 2 2h1v-6H4" /></svg>
);
export const Clock = ({ size = 20, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const User = ({ size = 20, className }: P) => (
  <svg {...base(size)} strokeWidth="2.2" className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const Search = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
);
export const Ticket = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth="2.2" className={className}><path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M9 8V5h6v3" /></svg>
);
export const Help = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth="2.2" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
);
export const Building = ({ size = 28, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-5h6v5" /></svg>
);
export const Plane = ({ size = 28, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><path d="M2 16l20-6-4-3-6 2-6-5-2 1 4 6-4 1-2-2-2 1z" /></svg>
);
export const Globe = ({ size = 28, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
);
export const Download = ({ size = 20, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
);
export const Calendar = ({ size = 20, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>
);
export const Share = ({ size = 20, className }: P) => (
  <svg {...base(size)} strokeWidth="2.4" className={className}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
);

/** Hero'daki beyaz dekoratif bulut. */
export const CloudShape = ({ width, height, className }: { width: number; height: number; className?: string }) => (
  <svg width={width} height={height} viewBox="0 0 160 110" aria-hidden="true" className={className}>
    <path d="M30 92 a24 24 0 0 1 2 -48 a30 30 0 0 1 56 -14 a26 26 0 0 1 42 26 a19 19 0 0 1 -4 36 Z" fill="#FFFFFF" />
  </svg>
);
