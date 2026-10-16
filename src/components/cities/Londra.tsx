// Kaynak: assets/cities/londra.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Londra(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Londra illüstrasyonu: saat kulesi ve kırmızı iki katlı otobüs"
      {...props}
    >
      <rect width="320" height="180" fill="#DCE3F0" />
      <path d="M200 50 a16 10 0 0 1 32 -2 a14 9 0 0 1 26 4 Z" fill="#FFFFFF" />
      <path d="M40 70 a14 9 0 0 1 28 -2 a12 8 0 0 1 22 4 Z" fill="#FFFFFF" />
      <g fill="#3A4A7A">
      <rect x="112" y="56" width="34" height="100" />
      <path d="M108 58 L 129 16 L 150 58 Z" />
      <rect x="127" y="6" width="4" height="12" />
      <rect x="60" y="112" width="52" height="44" />
      <rect x="146" y="118" width="50" height="38" />
      </g>
      <circle cx="129" cy="76" r="11" fill="#FFF4D6" />
      <path d="M129 70 V 76 L 134 79" fill="none" stroke="#3A4A7A" strokeWidth="2.5" strokeLinecap="round" />
      <rect y="154" width="320" height="26" fill="#B8C3D9" />
      <rect x="206" y="104" width="92" height="52" rx="10" fill="#E5484D" />
      <g fill="#FFF4D6"><rect x="214" y="112" width="16" height="12" rx="3" /><rect x="236" y="112" width="16" height="12" rx="3" /><rect x="258" y="112" width="16" height="12" rx="3" /><rect x="280" y="112" width="12" height="12" rx="3" /><rect x="214" y="132" width="16" height="12" rx="3" /><rect x="236" y="132" width="16" height="12" rx="3" /><rect x="258" y="132" width="16" height="12" rx="3" /></g>
      <circle cx="226" cy="158" r="8" fill="#1E2A44" /><circle cx="280" cy="158" r="8" fill="#1E2A44" />
    </svg>
  );
}
