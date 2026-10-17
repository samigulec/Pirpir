// Kaynak: assets/cities/trabzon.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Trabzon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Trabzon illüstrasyonu: yeşil yaylalar, çay bahçeleri ve Karadeniz"
      {...props}
    >
      <rect width="320" height="180" fill="#D9F0FF" />
      <path d="M30 36 a14 9 0 0 1 28 -2 a12 8 0 0 1 22 4 Z" fill="#FFFFFF" />
      <path d="M190 30 a16 10 0 0 1 32 -2 a14 9 0 0 1 26 4 Z" fill="#FFFFFF" />
      <path d="M0 120 Q 60 40 140 90 Q 210 30 320 96 V140 H0 Z" fill="#2E7A4D" />
      <path d="M0 132 Q 90 70 180 112 Q 250 80 320 116 V140 H0 Z" fill="#4CAF7A" />
      <g stroke="#2E7A4D" strokeWidth="3" strokeLinecap="round" fill="none">
      <path d="M24 122 q20 -14 40 -16" /><path d="M30 130 q24 -16 50 -18" /><path d="M200 116 q24 -12 50 -10" /><path d="M210 126 q26 -12 56 -8" />
      </g>
      <g>
      <rect x="132" y="96" width="30" height="20" fill="#FFFFFF" /><path d="M128 98 L147 84 L166 98 Z" fill="#E07A5F" /><rect x="143" y="104" width="8" height="12" fill="#3A4A7A" />
      <rect x="96" y="104" width="20" height="14" fill="#FFFFFF" /><path d="M93 106 L106 96 L119 106 Z" fill="#E07A5F" />
      </g>
      <rect y="138" width="320" height="42" fill="#3E6FD8" />
      <path d="M20 156 q10 -5 20 0 M120 168 q10 -5 20 0 M270 160 q10 -5 20 0" fill="none" stroke="#9CC3FF" strokeWidth="3" strokeLinecap="round" />
      <path d="M190 154 h50 q-4 10 -14 10 h-24 q-8 0 -12 -10 Z" fill="#FFFFFF" /><rect x="206" y="146" width="16" height="8" rx="2" fill="#FFFFFF" />
    </svg>
  );
}
