import Link from "next/link";
import { brand } from "@/config/brand";

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="#FFD166" />
      <path d="M9 23 C 15 12, 25 12, 31 18" fill="none" stroke="#1E2A44" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 6" />
      <circle cx="31" cy="18" r="3.5" fill="#FF8A65" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 text-ink no-underline">
      {compact ? (
        <>
          <LogoMark size={30} />
          <span className="font-display text-[25px] font-bold">{brand.name}</span>
        </>
      ) : (
        <>
          <LogoMark />
          <span className="font-display text-[28px] font-bold tracking-[-0.01em]">{brand.name}</span>
        </>
      )}
    </Link>
  );
}
