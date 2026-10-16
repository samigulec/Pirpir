// Kaynak: assets/cities/barselona.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Barselona(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Barselona illüstrasyonu: sivri kuleli bazilika ve deniz"
      {...props}
    >
      <rect width="320" height="180" fill="#D7ECFF" />
      <circle cx="66" cy="46" r="20" fill="#FFD166" />
      <g fill="#C78E5A">
      <path d="M110 140 V 70 Q 116 30 122 70 V 140 Z" />
      <path d="M132 140 V 56 Q 139 12 146 56 V 140 Z" />
      <path d="M156 140 V 56 Q 163 12 170 56 V 140 Z" />
      <path d="M180 140 V 70 Q 186 30 192 70 V 140 Z" />
      <rect x="100" y="104" width="102" height="36" />
      </g>
      <g fill="#9E6A3E"><rect x="136" y="70" width="6" height="10" rx="3" /><rect x="160" y="70" width="6" height="10" rx="3" /><rect x="136" y="88" width="6" height="10" rx="3" /><rect x="160" y="88" width="6" height="10" rx="3" /><path d="M140 140 V 124 a11 11 0 0 1 22 0 V 140 Z" /></g>
      <g fill="#FF8A65"><circle cx="139" cy="14" r="3.5" /><circle cx="163" cy="14" r="3.5" /></g>
      <rect y="138" width="320" height="42" fill="#5B8DEF" />
      <path d="M20 154 q10 -5 20 0 M220 160 q10 -5 20 0 M100 168 q10 -5 20 0" fill="none" stroke="#9CC3FF" strokeWidth="3" strokeLinecap="round" />
      <path d="M250 150 L 270 112 L 272 150 Z" fill="#FFFFFF" /><path d="M244 152 h34 l-5 7 h-24 Z" fill="#FF8A65" />
    </svg>
  );
}
