// Kaynak: assets/cities/kapadokya.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Kapadokya(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Kapadokya illüstrasyonu: peribacaları ve sıcak hava balonları"
      {...props}
    >
      <rect width="320" height="180" fill="#FFE3CF" />
      <circle cx="262" cy="40" r="18" fill="#FFB38A" />
      <g>
      <circle cx="72" cy="46" r="20" fill="#FF8A65" /><path d="M56 56 L66 74 h12 L88 56 Z" fill="#FF8A65" /><path d="M72 26 V66" stroke="#FFFFFF" strokeWidth="3" /><rect x="66" y="76" width="12" height="9" rx="2" fill="#9B6A3C" />
      <circle cx="176" cy="34" r="15" fill="#5B8DEF" /><path d="M164 42 L171 56 h10 L188 42 Z" fill="#5B8DEF" /><path d="M176 19 V50" stroke="#FFD166" strokeWidth="3" /><rect x="171" y="58" width="10" height="7" rx="2" fill="#9B6A3C" />
      <circle cx="230" cy="80" r="11" fill="#FFD166" /><path d="M221 86 L226 96 h8 L239 86 Z" fill="#FFD166" /><rect x="226" y="98" width="8" height="6" rx="2" fill="#9B6A3C" />
      </g>
      <path d="M0 140 Q 160 124 320 138 V180 H0 Z" fill="#E9C79A" />
      <g fill="#E9B98A">
      <path d="M40 146 L56 92 L72 146 Z" /><path d="M96 146 L116 78 L136 146 Z" /><path d="M150 146 L162 104 L174 146 Z" /><path d="M196 146 L218 84 L240 146 Z" /><path d="M260 146 L274 100 L288 146 Z" />
      </g>
      <g fill="#9B6A3C">
      <ellipse cx="56" cy="94" rx="10" ry="5" /><ellipse cx="116" cy="80" rx="12" ry="6" /><ellipse cx="162" cy="106" rx="8" ry="4" /><ellipse cx="218" cy="86" rx="12" ry="6" /><ellipse cx="274" cy="102" rx="9" ry="4" />
      </g>
      <g fill="#3A4A7A"><rect x="112" y="116" width="7" height="10" rx="3.5" /><rect x="214" y="118" width="7" height="10" rx="3.5" /><rect x="53" y="124" width="6" height="8" rx="3" /></g>
      <path d="M0 160 Q 160 148 320 160 V180 H0 Z" fill="#D9AE7A" />
    </svg>
  );
}
