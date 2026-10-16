// Kaynak: assets/cities/roma.svg — npm run svg ile üretildi, elle düzenleme.
import { useId } from "react";
import type { SVGProps } from "react";

export function Roma(props: SVGProps<SVGSVGElement>) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Roma illüstrasyonu: kemerli antik amfitiyatro"
      {...props}
    >
      <defs><pattern id={id} width="24" height="22" patternUnits="userSpaceOnUse" x="62"><rect x="6" y="4" width="12" height="16" rx="6" fill="#B86E4B" /></pattern></defs>
      <rect width="320" height="180" fill="#FFE9B8" />
      <circle cx="250" cy="48" r="22" fill="#FFD166" />
      <path d="M40 66 a14 9 0 0 1 28 -2 a12 8 0 0 1 22 4 Z" fill="#FFFFFF" />
      <path d="M58 148 V 84 Q 160 60 262 76 V 148 Z" fill="#E8A87C" />
      <path d="M58 92 Q 160 70 262 84" fill="none" stroke="#C97F5A" strokeWidth="3" />
      <rect x="62" y="96" width="196" height="22" fill={`url(#${id})`} />
      <rect x="62" y="122" width="196" height="22" fill={`url(#${id})`} />
      <path d="M262 76 L 280 100 V 148 H 262 Z" fill="#D9946B" />
      <rect y="146" width="320" height="34" fill="#E9D3A6" />
      <path d="M24 160 h40 M240 168 h50" stroke="#D7BC88" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
