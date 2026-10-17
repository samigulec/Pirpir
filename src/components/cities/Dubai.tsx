// Kaynak: assets/cities/dubai.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Dubai(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Dubai illüstrasyonu: çok yüksek bir gökdelen, şehir ve kum tepeleri"
      {...props}
    >
      <rect width="320" height="180" fill="#FFE9D6" />
      <circle cx="250" cy="52" r="24" fill="#FFB38A" />
      <path d="M40 60 a14 9 0 0 1 28 -2 a12 8 0 0 1 22 4 Z" fill="#FFFFFF" />
      <g fill="#6B7BA8">
      <rect x="92" y="108" width="26" height="44" />
      <rect x="186" y="98" width="30" height="54" />
      <rect x="222" y="118" width="20" height="34" />
      <rect x="66" y="124" width="20" height="28" />
      <path d="M186 98 q15 -18 30 0 Z" />
      </g>
      <g fill="#3A4A7A">
      <rect x="136" y="110" width="30" height="42" />
      <rect x="140" y="80" width="22" height="32" />
      <rect x="144" y="54" width="14" height="28" />
      <rect x="147" y="32" width="8" height="24" />
      <rect x="150" y="10" width="2" height="24" />
      </g>
      <g fill="#FFF4D6">
      <rect x="142" y="118" width="4" height="6" /><rect x="150" y="118" width="4" height="6" /><rect x="158" y="118" width="4" height="6" />
      <rect x="146" y="90" width="4" height="6" /><rect x="154" y="90" width="4" height="6" />
      <rect x="149" y="64" width="4" height="6" />
      <rect x="98" y="116" width="4" height="6" /><rect x="108" y="116" width="4" height="6" /><rect x="194" y="110" width="4" height="6" /><rect x="204" y="110" width="4" height="6" />
      </g>
      <path d="M0 150 Q 70 128 150 148 Q 230 128 320 146 V180 H0 Z" fill="#F2C98A" />
      <path d="M0 166 Q 90 150 180 166 Q 250 154 320 164 V180 H0 Z" fill="#E8B36E" />
    </svg>
  );
}
