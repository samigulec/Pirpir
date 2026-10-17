// Kaynak: assets/cities/lizbon.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Lizbon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Lizbon illüstrasyonu: tepede renkli evler ve sarı tramvay"
      {...props}
    >
      <rect width="320" height="180" fill="#FFF1C9" />
      <circle cx="262" cy="44" r="22" fill="#FFB38A" />
      <path d="M0 118 Q 150 50 320 104 V180 H0 Z" fill="#F6D8B0" />
      <g>
      <rect x="40" y="94" width="24" height="24" fill="#F6A6A0" /><path d="M38 96 L52 84 L66 96 Z" fill="#E07A5F" />
      <rect x="70" y="82" width="26" height="30" fill="#9CC3FF" /><path d="M68 84 L83 72 L98 84 Z" fill="#E07A5F" />
      <rect x="102" y="74" width="24" height="32" fill="#FFFFFF" /><path d="M100 76 L114 64 L128 76 Z" fill="#E07A5F" />
      <rect x="186" y="72" width="26" height="32" fill="#FFD166" /><path d="M184 74 L199 62 L214 74 Z" fill="#E07A5F" />
      <rect x="218" y="80" width="24" height="28" fill="#F6A6A0" /><path d="M216 82 L230 70 L244 82 Z" fill="#E07A5F" />
      <rect x="248" y="88" width="26" height="24" fill="#9CC3FF" /><path d="M246 90 L261 78 L276 90 Z" fill="#E07A5F" />
      </g>
      <g fill="#3A4A7A">
      <rect x="48" y="102" width="6" height="8" rx="2" /><rect x="80" y="90" width="6" height="8" rx="2" /><rect x="110" y="84" width="6" height="8" rx="2" /><rect x="196" y="82" width="6" height="8" rx="2" /><rect x="227" y="90" width="6" height="8" rx="2" /><rect x="258" y="96" width="6" height="8" rx="2" />
      </g>
      <path d="M0 98 L 320 74" stroke="#3A4A7A" strokeWidth="1.5" />
      <path d="M168 86 L 156 108" stroke="#3A4A7A" strokeWidth="2.5" />
      <rect y="150" width="320" height="30" fill="#C9B79C" />
      <path d="M0 156 H320" stroke="#8C7A5E" strokeWidth="2" />
      <rect x="104" y="108" width="112" height="44" rx="10" fill="#FFD166" />
      <rect x="104" y="136" width="112" height="6" fill="#FFFFFF" />
      <g fill="#FFF4D6"><rect x="114" y="116" width="18" height="14" rx="3" /><rect x="138" y="116" width="18" height="14" rx="3" /><rect x="162" y="116" width="18" height="14" rx="3" /><rect x="186" y="116" width="20" height="14" rx="3" /></g>
      <circle cx="126" cy="154" r="6" fill="#1E2A44" /><circle cx="194" cy="154" r="6" fill="#1E2A44" />
    </svg>
  );
}
