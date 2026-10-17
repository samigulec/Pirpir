// Bagaj türü simgeleri (özgün, dekoratif).
type P = { className?: string };
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

/** Kişisel eşya: koltuk altına sığan çanta */
export const PersonalItemIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M7 9h10l1 10H6z" /><path d="M9.5 9V7.5a2.5 2.5 0 0 1 5 0V9" /></svg>
);
/** Kabin bagajı: tekerlekli küçük bavul */
export const CabinBagIcon = ({ className }: P) => (
  <svg {...base} className={className}><rect x="7" y="7" width="10" height="12" rx="2" /><path d="M10 7V4.5h4V7M9.5 21v-2M14.5 21v-2" /></svg>
);
/** Bagaj: büyük bavul */
export const CheckedBagIcon = ({ className }: P) => (
  <svg {...base} className={className}><rect x="5.5" y="6" width="13" height="14" rx="2.5" /><path d="M9.5 6V3.5h5V6M9 10v6M15 10v6M8 22v-2M16 22v-2" /></svg>
);
