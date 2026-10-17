// Kaynak: assets/cities/ankara.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Ankara(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Ankara illüstrasyonu: tepede sütunlu anıt yapı ve geniş merdivenler"
      {...props}
    >
      <rect width="320" height="180" fill="#E7EEF9" />
      <circle cx="258" cy="44" r="20" fill="#FFD166" />
      <path d="M40 46 a14 9 0 0 1 28 -2 a12 8 0 0 1 22 4 Z" fill="#FFFFFF" />
      <path d="M0 132 Q 160 112 320 132 V180 H0 Z" fill="#C9D6B0" />
      <g fill="#3A4A7A">
      <rect x="70" y="70" width="180" height="12" />
      <rect x="66" y="64" width="188" height="8" />
      <rect x="70" y="112" width="180" height="10" />
      </g>
      <g fill="#6B7BA8">
      <rect x="76" y="82" width="8" height="30" /><rect x="92" y="82" width="8" height="30" /><rect x="108" y="82" width="8" height="30" /><rect x="124" y="82" width="8" height="30" /><rect x="140" y="82" width="8" height="30" /><rect x="156" y="82" width="8" height="30" /><rect x="172" y="82" width="8" height="30" /><rect x="188" y="82" width="8" height="30" /><rect x="204" y="82" width="8" height="30" /><rect x="220" y="82" width="8" height="30" /><rect x="236" y="82" width="8" height="30" />
      </g>
      <g fill="#B8C3D9"><rect x="60" y="122" width="200" height="8" /><rect x="50" y="130" width="220" height="8" /><rect x="40" y="138" width="240" height="8" /></g>
      <g fill="#4CAF7A"><circle cx="24" cy="132" r="12" /><circle cx="296" cy="132" r="12" /><circle cx="40" cy="140" r="9" /><circle cx="282" cy="142" r="9" /></g>
    </svg>
  );
}
