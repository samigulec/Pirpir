// Kaynak: assets/characters/valiz.svg — tasarımlardaki varyantlar için prop destekli.
import type { SVGProps } from "react";

type ValizProps = SVGProps<SVGSVGElement> & {
  /** Gövdedeki ince şerit. */
  stripe?: boolean;
  highlights?: boolean;
  /** Sarı bagaj etiketi. */
  tag?: boolean;
  happy?: boolean;
};

export function Valiz({ stripe = true, highlights = true, tag = true, happy = false, ...props }: ValizProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150" role="img" aria-label="Valiz karakteri" {...props}>
      <path d="M44 30 V 16 a8 8 0 0 1 8 -8 h16 a8 8 0 0 1 8 8 V 30" fill="none" stroke="#1E2A44" strokeWidth="5" strokeLinecap="round" />
      <rect x="16" y="30" width="88" height="100" rx="20" fill="#FF8A65" stroke="#1E2A44" strokeWidth="4.5" />
      {stripe && <path d="M16 56 H 104" stroke="#1E2A44" strokeWidth="3" opacity="0.25" />}
      {happy ? (
        <>
          <path d="M40 78 Q 46 72 52 78" fill="none" stroke="#1E2A44" strokeWidth="4.5" strokeLinecap="round" /><path d="M68 78 Q 74 72 80 78" fill="none" stroke="#1E2A44" strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="46" cy="78" r="5.5" fill="#1E2A44" /><circle cx="74" cy="78" r="5.5" fill="#1E2A44" />
          {highlights && (
            <>
              <circle cx="48" cy="76" r="1.8" fill="#FFFFFF" /><circle cx="76" cy="76" r="1.8" fill="#FFFFFF" />
            </>
          )}
        </>
      )}
      <ellipse cx="36" cy="92" rx="7" ry="4.5" fill="#FFD1C2" /><ellipse cx="84" cy="92" rx="7" ry="4.5" fill="#FFD1C2" />
      {happy ? (
        <path d="M52 88 Q 60 102 68 88 Z" fill="#1E2A44" />
      ) : (
        <path d="M53 90 Q 60 98 67 90" fill="none" stroke="#1E2A44" strokeWidth="4" strokeLinecap="round" />
      )}
      {tag && <rect x="72" y="106" width="22" height="14" rx="4" fill="#FFD166" stroke="#1E2A44" strokeWidth="2.5" />}
      <circle cx="36" cy="138" r="7" fill="#1E2A44" /><circle cx="84" cy="138" r="7" fill="#1E2A44" />
    </svg>
  );
}
