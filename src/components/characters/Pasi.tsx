// Kaynak: assets/characters/pasi.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Pasi(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 150"
      role="img"
      aria-label="Pasi, pasaport karakteri"
      {...props}
    >
      <rect x="18" y="14" width="84" height="120" rx="12" fill="#B5446E" stroke="#1E2A44" strokeWidth="4.5" />
      <circle cx="60" cy="44" r="12" fill="none" stroke="#FFD166" strokeWidth="3.5" />
      <circle cx="46" cy="82" r="8" fill="#FFFFFF" /><circle cx="74" cy="82" r="8" fill="#FFFFFF" />
      <circle cx="47" cy="83" r="4.5" fill="#1E2A44" /><circle cx="75" cy="83" r="4.5" fill="#1E2A44" />
      <ellipse cx="36" cy="98" rx="6" ry="4" fill="#FFB4A2" /><ellipse cx="84" cy="98" rx="6" ry="4" fill="#FFB4A2" />
      <path d="M53 96 Q 60 104 67 96" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <rect x="36" y="114" width="48" height="5" rx="2.5" fill="#FFD166" />
    </svg>
  );
}
