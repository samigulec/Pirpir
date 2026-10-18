import { Link } from "@/i18n/navigation";
import { brand } from "@/config/brand";
import { Pirpir } from "./characters";

/** Logo işareti: sevinen Pırpır (çevresindeki boşluk kırpılmış). `size` yüksekliktir. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return <Pirpir happy viewBox="16 14 176 112" width={Math.round(size * 1.57)} height={size} role={undefined} aria-label={undefined} aria-hidden="true" />;
}

/** Yazı logosu: dördüncü harf mercan ("pirpir" → pir·p·ir), Pırpır'ın kuyruk rengi. */
export function Wordmark({ className = "" }: { className?: string }) {
  const n = brand.name;
  return (
    <span className={`font-display font-bold ${className}`}>
      {n.slice(0, 3)}
      <span className="text-coral">{n.slice(3, 4)}</span>
      {n.slice(4)}
    </span>
  );
}

export function Logo({ compact = false, tight = false }: { compact?: boolean; tight?: boolean }) {
  return (
    <Link href="/" aria-label={brand.name} className="flex items-center gap-2 text-ink no-underline">
      {compact ? (
        <>
          <LogoMark size={28} />
          <Wordmark className="text-[25px]" />
        </>
      ) : (
        <>
          <LogoMark />
          <Wordmark className={`text-[28px] ${tight ? "tracking-[-0.01em]" : ""}`} />
        </>
      )}
    </Link>
  );
}
