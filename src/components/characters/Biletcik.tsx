// Kaynak: assets/characters/biletcik.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Biletcik(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 170 110"
      role="img"
      aria-label="Biletçik, biniş kartı karakteri"
      {...props}
    >
      <path d="M14 18 H156 a6 6 0 0 1 6 6 V44 a11 11 0 0 0 0 22 V86 a6 6 0 0 1 -6 6 H14 a6 6 0 0 1 -6 -6 V66 a11 11 0 0 0 0 -22 V24 a6 6 0 0 1 6 -6 Z" fill="#FFFFFF" stroke="#1E2A44" strokeWidth="4" strokeLinejoin="round" />
      <path d="M120 26 V 84" stroke="#1E2A44" strokeWidth="3" strokeDasharray="4 5" />
      <circle cx="52" cy="46" r="5" fill="#1E2A44" /><circle cx="82" cy="46" r="5" fill="#1E2A44" />
      <ellipse cx="42" cy="58" rx="6" ry="4" fill="#FFB4A2" /><ellipse cx="92" cy="58" rx="6" ry="4" fill="#FFB4A2" />
      <path d="M60 56 Q 67 64 74 56" fill="none" stroke="#1E2A44" strokeWidth="4" strokeLinecap="round" />
      <rect x="34" y="72" width="66" height="6" rx="3" fill="#4CAF7A" />
      <path d="M132 50 l 16 6 l -16 6 l 3 -6 Z" fill="#2F5BD3" />
    </svg>
  );
}
