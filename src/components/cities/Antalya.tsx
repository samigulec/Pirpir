// Kaynak: assets/cities/antalya.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Antalya(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Antalya illüstrasyonu: güneş, deniz, plaj ve palmiye"
      {...props}
    >
      <rect width="320" height="180" fill="#BFE3FF" />
      <circle cx="80" cy="54" r="26" fill="#FFD166" />
      <path d="M150 104 L 200 62 L 240 90 L 270 70 L 320 104 Z" fill="#8FB8E8" />
      <rect y="102" width="320" height="34" fill="#5B8DEF" />
      <path d="M30 116 q10 -5 20 0 M130 122 q10 -5 20 0 M250 114 q10 -5 20 0" fill="none" stroke="#BFE3FF" strokeWidth="3" strokeLinecap="round" />
      <path d="M0 134 Q 160 120 320 134 V180 H0 Z" fill="#FFE3A3" />
      <path d="M236 168 Q 240 120 228 92" fill="none" stroke="#9B6A3C" strokeWidth="7" strokeLinecap="round" />
      <g fill="#4CAF7A"><path d="M228 92 Q 204 78 186 92 Q 208 86 228 92 Z" /><path d="M228 92 Q 250 72 272 84 Q 248 84 228 92 Z" /><path d="M228 92 Q 222 66 236 52 Q 230 74 228 92 Z" /><path d="M228 92 Q 206 96 196 116 Q 214 100 228 92 Z" /><path d="M228 92 Q 252 98 262 116 Q 244 100 228 92 Z" /></g>
      <path d="M70 150 L 82 132" stroke="#1E2A44" strokeWidth="3" />
      <path d="M56 136 a28 16 0 0 1 56 0 Z" fill="#FF8A65" />
      <rect x="120" y="150" width="34" height="8" rx="4" fill="#FFFFFF" />
    </svg>
  );
}
