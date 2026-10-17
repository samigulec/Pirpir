// Kaynak: assets/cities/gaziantep.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function Gaziantep(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Gaziantep illüstrasyonu: tepede yuvarlak burçlu kale, fıstık ağacı ve baklava tepsisi"
      {...props}
    >
      <rect width="320" height="180" fill="#FFF4D6" />
      <circle cx="64" cy="44" r="22" fill="#FFB38A" />
      <path d="M40 140 Q 150 70 260 140 Z" fill="#E9D3A6" />
      <g fill="#C98B5A">
      <rect x="104" y="80" width="92" height="34" />
      <rect x="96" y="70" width="22" height="44" rx="11" /><rect x="139" y="64" width="22" height="50" rx="11" /><rect x="182" y="70" width="22" height="44" rx="11" />
      </g>
      <g fill="#C98B5A"><rect x="98" y="64" width="5" height="8" /><rect x="111" y="64" width="5" height="8" /><rect x="141" y="58" width="5" height="8" /><rect x="154" y="58" width="5" height="8" /><rect x="184" y="64" width="5" height="8" /><rect x="197" y="64" width="5" height="8" /></g>
      <g fill="#3A4A7A"><rect x="146" y="96" width="8" height="18" rx="4" /><rect x="104" y="84" width="5" height="8" rx="2.5" /><rect x="190" y="84" width="5" height="8" rx="2.5" /></g>
      <rect y="138" width="320" height="42" fill="#C9DDB0" />
      <rect x="262" y="104" width="7" height="38" fill="#9B6A3C" />
      <circle cx="266" cy="96" r="22" fill="#8DBF5A" /><circle cx="250" cy="104" r="12" fill="#8DBF5A" /><circle cx="284" cy="104" r="12" fill="#8DBF5A" />
      <g fill="#B5446E"><circle cx="258" cy="92" r="2.5" /><circle cx="272" cy="100" r="2.5" /><circle cx="264" cy="106" r="2.5" /></g>
      <ellipse cx="70" cy="156" rx="40" ry="10" fill="#B8C3D9" />
      <ellipse cx="70" cy="152" rx="34" ry="7" fill="#E9B44C" />
      <path d="M46 152 h48 M58 147 l-6 10 M70 146 l-6 12 M82 147 l-6 10" stroke="#C98B2E" strokeWidth="2" />
      <g fill="#8DBF5A"><circle cx="60" cy="151" r="1.8" /><circle cx="74" cy="150" r="1.8" /><circle cx="86" cy="153" r="1.8" /></g>
    </svg>
  );
}
