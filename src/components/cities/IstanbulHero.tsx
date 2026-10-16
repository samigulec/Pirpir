// Kaynak: assets/cities/istanbul-hero.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function IstanbulHero(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 960 340"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="İstanbul illüstrasyonu: kubbeli cami, minareler, Galata Kulesi, boğaz köprüsü, vapur ve martı"
      {...props}
    >
      <rect width="960" height="340" fill="#FFD9C7" />
      <circle cx="700" cy="96" r="54" fill="#FFB38A" />
      <path d="M120 70 q10 -10 20 0 q10 -10 20 0" fill="none" stroke="#3A4A7A" strokeWidth="4" strokeLinecap="round" />
      <path d="M560 50 q8 -8 16 0 q8 -8 16 0" fill="none" stroke="#3A4A7A" strokeWidth="4" strokeLinecap="round" />
      <path d="M260 110 q7 -7 14 0 q7 -7 14 0" fill="none" stroke="#3A4A7A" strokeWidth="3.5" strokeLinecap="round" />
      <g fill="#E9B9A3">
      <path d="M0 250 Q 60 230 120 240 L 160 224 Q 220 214 260 232 V 260 H 0 Z" />
      </g>
      <g fill="#3A4A7A">
      <rect x="290" y="186" width="230" height="74" />
      <path d="M330 190 a75 75 0 0 1 150 0 Z" />
      <path d="M296 202 a26 26 0 0 1 52 0 Z" /><path d="M462 202 a26 26 0 0 1 52 0 Z" />
      <path d="M360 140 a14 14 0 0 1 28 0 Z" transform="translate(0 -6)" />
      <rect x="403" y="98" width="5" height="18" />
      <rect x="262" y="88" width="11" height="172" /><path d="M260 90 L 267.5 50 L 275 90 Z" /><rect x="259" y="132" width="17" height="5" rx="2" />
      <rect x="537" y="88" width="11" height="172" /><path d="M535 90 L 542.5 50 L 550 90 Z" /><rect x="534" y="132" width="17" height="5" rx="2" />
      <rect x="160" y="170" width="38" height="90" /><path d="M153 172 L 179 118 L 205 172 Z" />
      </g>
      <g fill="#FFD9C7"><rect x="168" y="186" width="7" height="14" rx="3.5" /><rect x="183" y="186" width="7" height="14" rx="3.5" /><rect x="168" y="212" width="7" height="14" rx="3.5" /><rect x="183" y="212" width="7" height="14" rx="3.5" /><path d="M392 260 V 236 a13 13 0 0 1 26 0 V 260 Z" /></g>
      <g stroke="#3A4A7A" fill="none" strokeLinecap="round">
      <path d="M640 260 V 150" strokeWidth="10" /><path d="M880 260 V 150" strokeWidth="10" />
      <path d="M600 214 Q 640 150 640 150 Q 760 236 880 150 Q 920 214 960 214" strokeWidth="4" />
      <path d="M580 220 H 960" strokeWidth="8" />
      <path d="M676 172 V 220 M712 188 V 220 M748 200 V 220 M772 200 V 220 M808 188 V 220 M844 172 V 220" strokeWidth="2.5" />
      </g>
      <rect y="258" width="960" height="82" fill="#5B8DEF" />
      <path d="M40 286 q14 -7 28 0 M180 308 q14 -7 28 0 M480 296 q14 -7 28 0 M700 318 q14 -7 28 0 M860 290 q14 -7 28 0" fill="none" stroke="#9CC3FF" strokeWidth="4" strokeLinecap="round" />
      <path d="M300 284 h120 l-16 20 h-88 Z" fill="#FFFFFF" /><rect x="330" y="266" width="56" height="18" rx="4" fill="#FFFFFF" /><rect x="346" y="252" width="10" height="16" fill="#FF8A65" />
      <g fill="#2F5BD3"><rect x="336" y="271" width="8" height="7" rx="2" /><rect x="350" y="271" width="8" height="7" rx="2" /><rect x="364" y="271" width="8" height="7" rx="2" /></g>
    </svg>
  );
}
