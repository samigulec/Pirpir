// Kaynak: assets/cities/paris.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Paris(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Paris illüstrasyonu: demir kule ve parkta ağaçlar"
      {...props}
    >
      <rect width="320" height="180" fill="#FFE0E6" />
      <circle cx="256" cy="50" r="20" fill="#FFB4A2" />
      <path d="M44 56 a14 9 0 0 1 28 -2 a12 8 0 0 1 22 4 Z" fill="#FFFFFF" />
      <g fill="#3A4A7A">
      <path d="M160 14 L 166 60 L 176 104 L 196 156 H 178 Q 160 120 142 156 H 124 L 144 104 L 154 60 Z" />
      <rect x="157" y="6" width="6" height="12" />
      </g>
      <g fill="#FFE0E6"><path d="M158 64 h4 l2 32 h-8 Z" /><path d="M150 112 h20 l4 14 h-28 Z" /></g>
      <rect x="146" y="58" width="28" height="5" rx="2" fill="#3A4A7A" />
      <rect x="136" y="100" width="48" height="6" rx="3" fill="#3A4A7A" />
      <rect y="152" width="320" height="28" fill="#8FCB9B" />
      <g fill="#4CAF7A"><circle cx="50" cy="146" r="18" /><circle cx="84" cy="150" r="14" /><circle cx="236" cy="146" r="18" /><circle cx="270" cy="150" r="14" /></g>
    </svg>
  );
}
