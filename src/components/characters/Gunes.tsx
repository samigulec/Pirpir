// Kaynak: assets/characters/gunes.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Gunes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 140"
      role="img"
      aria-label="Güneş, güneş gözlüklü güneş karakteri"
      {...props}
    >
      <g stroke="#FFB020" strokeWidth="8" strokeLinecap="round"><path d="M70 8 V 20" /><path d="M70 120 V 132" /><path d="M8 70 H 20" /><path d="M120 70 H 132" /><path d="M26 26 L 34 34" /><path d="M106 106 L 114 114" /><path d="M114 26 L 106 34" /><path d="M26 114 L 34 106" /></g>
      <circle cx="70" cy="70" r="40" fill="#FFD166" stroke="#1E2A44" strokeWidth="4" />
      <rect x="42" y="56" width="24" height="15" rx="7" fill="#1E2A44" /><rect x="74" y="56" width="24" height="15" rx="7" fill="#1E2A44" /><path d="M66 61 H 74" stroke="#1E2A44" strokeWidth="3" />
      <ellipse cx="46" cy="84" rx="6" ry="4" fill="#FF8A65" /><ellipse cx="94" cy="84" rx="6" ry="4" fill="#FF8A65" />
      <path d="M58 86 Q 70 98 82 86" fill="none" stroke="#1E2A44" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
