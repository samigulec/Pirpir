// Kaynak: assets/characters/bulut.svg — tasarımlardaki varyantlar için prop destekli.
import type { SVGProps } from "react";

type BulutProps = SVGProps<SVGSVGElement> & {
  highlights?: boolean;
  happy?: boolean;
  /** Küçük boyutta (mobil) daha kalın çizgi. */
  bold?: boolean;
};

export function Bulut({ highlights = true, happy = false, bold = false, ...props }: BulutProps) {
  const sw = bold ? 5 : 4;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110" role="img" aria-label="Bulut karakteri" {...props}>
      <path d="M30 92 a24 24 0 0 1 2 -48 a30 30 0 0 1 56 -14 a26 26 0 0 1 42 26 a19 19 0 0 1 -4 36 Z" fill="#FFFFFF" stroke="#1E2A44" strokeWidth={sw} strokeLinejoin="round" />
      {happy ? (
        <>
          <path d="M60 62 Q 66 56 72 62" fill="none" stroke="#1E2A44" strokeWidth="4" strokeLinecap="round" /><path d="M90 62 Q 96 56 102 62" fill="none" stroke="#1E2A44" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="66" cy="62" r={bold ? 5.5 : 5} fill="#1E2A44" /><circle cx="96" cy="62" r={bold ? 5.5 : 5} fill="#1E2A44" />
          {highlights && (
            <>
              <circle cx="68" cy="60" r="1.6" fill="#FFFFFF" /><circle cx="98" cy="60" r="1.6" fill="#FFFFFF" />
            </>
          )}
        </>
      )}
      <ellipse cx="56" cy="76" rx="7" ry="4.5" fill="#FFB4A2" /><ellipse cx="106" cy="76" rx="7" ry="4.5" fill="#FFB4A2" />
      {happy ? (
        <path d="M72 72 Q 81 86 90 72 Z" fill="#1E2A44" />
      ) : (
        <path d="M74 74 Q 81 82 88 74" fill="none" stroke="#1E2A44" strokeWidth={sw} strokeLinecap="round" />
      )}
    </svg>
  );
}
