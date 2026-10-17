// Kaynak: assets/cities/izmir.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Izmir(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="İzmir illüstrasyonu: Saat Kulesi, palmiyeler ve körfezde vapur"
      {...props}
    >
      <rect width="320" height="180" fill="#FFE3CF" />
      <circle cx="252" cy="48" r="24" fill="#FFB38A" />
      <path d="M40 46 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#3A4A7A" strokeWidth="2.5" strokeLinecap="round" />
      <rect y="128" width="320" height="12" fill="#F2D3A6" />
      <g fill="#3A4A7A">
      <rect x="142" y="98" width="36" height="32" />
      <rect x="148" y="70" width="24" height="30" />
      <rect x="152" y="52" width="16" height="20" />
      <path d="M150 54 a10 10 0 0 1 20 0 Z" />
      <rect x="159" y="32" width="2" height="14" />
      <rect x="138" y="96" width="44" height="4" rx="2" />
      <rect x="144" y="68" width="32" height="4" rx="2" />
      </g>
      <path d="M154 130 v-14 a6 6 0 0 1 12 0 v14 Z" fill="#FFE3CF" />
      <circle cx="160" cy="84" r="7" fill="#FFF4D6" />
      <path d="M160 80 V84 L163 86" fill="none" stroke="#3A4A7A" strokeWidth="2" strokeLinecap="round" />
      <path d="M74 130 Q 78 100 70 78" fill="none" stroke="#9B6A3C" strokeWidth="6" strokeLinecap="round" />
      <g fill="#4CAF7A"><path d="M70 78 Q 50 68 36 80 Q 54 74 70 78 Z" /><path d="M70 78 Q 88 62 106 72 Q 86 72 70 78 Z" /><path d="M70 78 Q 64 58 76 46 Q 72 64 70 78 Z" /><path d="M70 78 Q 52 84 46 100 Q 60 86 70 78 Z" /></g>
      <path d="M250 130 Q 246 104 254 86" fill="none" stroke="#9B6A3C" strokeWidth="6" strokeLinecap="round" />
      <g fill="#4CAF7A"><path d="M254 86 Q 236 74 220 84 Q 238 80 254 86 Z" /><path d="M254 86 Q 272 72 290 82 Q 270 80 254 86 Z" /><path d="M254 86 Q 250 66 262 56 Q 256 72 254 86 Z" /><path d="M254 86 Q 270 92 276 108 Q 264 94 254 86 Z" /></g>
      <rect y="140" width="320" height="40" fill="#5B8DEF" />
      <path d="M20 158 q10 -5 20 0 M110 168 q10 -5 20 0 M280 162 q10 -5 20 0" fill="none" stroke="#9CC3FF" strokeWidth="3" strokeLinecap="round" />
      <path d="M186 152 h60 l-8 10 h-44 Z" fill="#FFFFFF" />
      <rect x="200" y="143" width="28" height="9" rx="2" fill="#FFFFFF" />
      <rect x="208" y="136" width="5" height="8" fill="#FF8A65" />
    </svg>
  );
}
