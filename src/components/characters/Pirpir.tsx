// Kaynak: assets/characters/pirpir.svg ve pirpir-mutlu.svg.
// Tasarım dosyalarında küçük farklarla kullanıldığı için varyant destekli.
import type { SVGProps } from "react";

type PirpirProps = SVGProps<SVGSVGElement> & {
  /** Arkadaki kesikli uçuş izi (ana sayfa hero). */
  trail?: boolean;
  /** Gövdedeki pencereler. */
  windows?: boolean;
  /** Gözlerdeki beyaz parıltı. */
  highlights?: boolean;
  /** Pervane kanatları. */
  blades?: boolean;
  /** Sevinen hali: kapalı gözler, açık ağız. */
  happy?: boolean;
  /** Gövde, kanat, kuyruk ve pervanenin dış çizgi rengi (koyu zeminde beyaz). */
  outline?: string;
};

export function Pirpir({
  trail = false,
  windows = true,
  highlights = true,
  blades = true,
  happy = false,
  outline = "#1E2A44",
  ...props
}: PirpirProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 140"
      role="img"
      aria-label={happy ? "Pırpır, sevinen küçük uçak" : "Pırpır, küçük uçak"}
      {...props}
    >
      {trail && (
        <path d="M30 120 Q 100 140 170 120" fill="none" stroke="#C9DCF7" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 10" />
      )}
      <path d="M70 52 L 95 18 L 118 22 L 108 54 Z" fill="#9CC3FF" stroke={outline} strokeWidth="4" strokeLinejoin="round" />
      <path d="M34 58 L 20 26 L 40 26 L 58 52 Z" fill="#FF8A65" stroke={outline} strokeWidth="4" strokeLinejoin="round" />
      <rect x="24" y="46" width="146" height="56" rx="28" fill="#FFFFFF" stroke={outline} strokeWidth="4" />
      {windows && (
        <>
          <circle cx="52" cy="68" r="6" fill="#9CC3FF" /><circle cx="72" cy="68" r="6" fill="#9CC3FF" />
        </>
      )}
      {happy ? (
        <>
          <path d="M112 66 Q 118 60 124 66" fill="none" stroke="#1E2A44" strokeWidth="4" strokeLinecap="round" /><path d="M140 66 Q 146 60 152 66" fill="none" stroke="#1E2A44" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="118" cy="66" r="5.5" fill="#1E2A44" /><circle cx="146" cy="66" r="5.5" fill="#1E2A44" />
          {highlights && (
            <>
              <circle cx="120" cy="64" r="1.8" fill="#FFFFFF" /><circle cx="148" cy="64" r="1.8" fill="#FFFFFF" />
            </>
          )}
        </>
      )}
      <ellipse cx="110" cy="82" rx="7" ry="4.5" fill="#FFB4A2" /><ellipse cx="156" cy="82" rx="7" ry="4.5" fill="#FFB4A2" />
      {happy ? (
        <path d="M124 78 Q 132 94 140 78 Z" fill="#1E2A44" />
      ) : (
        <path d="M124 80 Q 132 90 140 80" fill="none" stroke="#1E2A44" strokeWidth="4" strokeLinecap="round" />
      )}
      <path d="M84 84 L 70 122 L 100 122 L 112 88 Z" fill="#5B8DEF" stroke={outline} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="176" cy="74" r="7" fill="#FFD166" stroke={outline} strokeWidth="4" />
      {blades && (
        <>
          <ellipse cx="184" cy="56" rx="4" ry="13" fill="#FFD166" stroke={outline} strokeWidth="3" />
          <ellipse cx="184" cy="92" rx="4" ry="13" fill="#FFD166" stroke={outline} strokeWidth="3" />
        </>
      )}
    </svg>
  );
}
