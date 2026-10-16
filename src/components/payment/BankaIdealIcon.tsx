// Kaynak: assets/payment/banka-ideal.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function BankaIdealIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 40"
      aria-hidden="true"
      {...props}
    >
      <path d="M10 15 L 28 5 L 46 15 Z" fill="#FF8A65" stroke="#1E2A44" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="12" y="15" width="32" height="17" fill="#FFFFFF" stroke="#1E2A44" strokeWidth="2.5" />
      <path d="M18 18 V 29 M38 18 V 29" stroke="#9CC3FF" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="25" cy="21" r="1.6" fill="#1E2A44" /><circle cx="31" cy="21" r="1.6" fill="#1E2A44" />
      <path d="M25.5 25 Q 28 27.5 30.5 25" fill="none" stroke="#1E2A44" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="8" y="32" width="40" height="4" rx="2" fill="#1E2A44" />
      <circle cx="28" cy="11" r="1.8" fill="#FFD166" />
    </svg>
  );
}
