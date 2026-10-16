// Kaynak: assets/payment/telefon-apple-pay.svg — npm run svg ile üretildi, elle düzenleme.
import type { SVGProps } from "react";

export function TelefonApplePayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 40"
      aria-hidden="true"
      {...props}
    >
      <rect x="17" y="3" width="22" height="34" rx="6" fill="#FFFFFF" stroke="#1E2A44" strokeWidth="2.5" />
      <rect x="24" y="6" width="8" height="2.5" rx="1.2" fill="#1E2A44" />
      <circle cx="28" cy="20" r="7.5" fill="#4CAF7A" />
      <path d="M24.5 20 l 2.5 2.5 l 4.5 -5" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14 Q 4 20 8 26 M12 16 Q 9.5 20 12 24" fill="none" stroke="#9CC3FF" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M48 14 Q 52 20 48 26 M44 16 Q 46.5 20 44 24" fill="none" stroke="#9CC3FF" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
