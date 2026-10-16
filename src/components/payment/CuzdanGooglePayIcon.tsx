// Kaynak: assets/payment/cuzdan-google-pay.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function CuzdanGooglePayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 40"
      aria-hidden="true"
      {...props}
    >
      <rect x="14" y="5" width="26" height="12" rx="3" fill="#9CC3FF" stroke="#1E2A44" strokeWidth="2" transform="rotate(-8 27 11)" />
      <rect x="6" y="11" width="44" height="25" rx="7" fill="#FFD166" stroke="#1E2A44" strokeWidth="2.5" />
      <path d="M36 19 H 50 V 29 H 36 a5 5 0 0 1 0 -10 Z" fill="#FF8A65" stroke="#1E2A44" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="38" cy="24" r="1.8" fill="#FFFFFF" />
      <circle cx="16" cy="22" r="1.8" fill="#1E2A44" /><circle cx="25" cy="22" r="1.8" fill="#1E2A44" />
      <path d="M17.5 27 Q 20.5 29.5 23.5 27" fill="none" stroke="#1E2A44" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
