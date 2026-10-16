// Kaynak: assets/payment/kart.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function KartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 40"
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="6" width="48" height="28" rx="6" fill="#9CC3FF" stroke="#1E2A44" strokeWidth="2.5" />
      <rect x="5.5" y="11" width="45" height="5" fill="#1E2A44" />
      <rect x="10" y="21" width="10" height="8" rx="2" fill="#FFD166" stroke="#1E2A44" strokeWidth="1.5" />
      <circle cx="35" cy="23" r="1.8" fill="#1E2A44" /><circle cx="44" cy="23" r="1.8" fill="#1E2A44" />
      <ellipse cx="32" cy="27" rx="2.2" ry="1.4" fill="#FFB4A2" /><ellipse cx="47" cy="27" rx="2.2" ry="1.4" fill="#FFB4A2" />
      <path d="M37 27 Q 39.5 29.5 42 27" fill="none" stroke="#1E2A44" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
