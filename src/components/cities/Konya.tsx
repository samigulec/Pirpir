// Kaynak: assets/cities/konya.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Konya(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Konya illüstrasyonu: yeşil külahlı türbe, kubbeler ve semazen"
      {...props}
    >
      <rect width="320" height="180" fill="#FFF1C9" />
      <circle cx="256" cy="46" r="22" fill="#FFB38A" />
      <g fill="#3A4A7A">
      <rect x="70" y="112" width="140" height="40" />
      <path d="M78 114 a20 20 0 0 1 40 0 Z" /><path d="M162 114 a20 20 0 0 1 40 0 Z" />
      <rect x="226" y="58" width="7" height="94" /><path d="M225 59 L229.5 34 L234 59 Z" />
      </g>
      <rect x="124" y="84" width="32" height="30" fill="#2E7A4D" />
      <path d="M120 86 L140 30 L160 86 Z" fill="#4CAF7A" />
      <path d="M130 86 L140 44 M150 86 L140 44 M140 86 V40" stroke="#2E7A4D" strokeWidth="3" />
      <rect x="139" y="20" width="2" height="12" fill="#3A4A7A" />
      <g fill="#FFF4D6"><rect x="90" y="126" width="8" height="12" rx="4" /><rect x="110" y="126" width="8" height="12" rx="4" /><rect x="162" y="126" width="8" height="12" rx="4" /><rect x="182" y="126" width="8" height="12" rx="4" /></g>
      <rect y="150" width="320" height="30" fill="#E9D3A6" />
      <g>
      <rect x="270" y="112" width="6" height="14" rx="3" fill="#B5446E" />
      <path d="M258 150 Q 273 118 288 150 Z" fill="#FFFFFF" />
      <circle cx="273" cy="108" r="5" fill="#FFE3CF" />
      <rect x="270" y="98" width="6" height="8" rx="2" fill="#9B6A3C" />
      <path d="M264 120 L 256 112 M282 120 L 290 112" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
