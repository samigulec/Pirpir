"use client";

import { useCurrency } from "../CurrencyProvider";

/** Fırsat sayfalarında fiyatları seçili para birimine anında çevirir. */
export function DealPrice({ amountTry, className }: { amountTry: number; className?: string }) {
  const { fmt } = useCurrency();
  return <span className={className}>{fmt(amountTry)}</span>;
}

export function DealNormalPrice({ amountTry, label }: { amountTry: number; label: string }) {
  const { fmt } = useCurrency();
  return <span>{label.replace("{price}", fmt(amountTry))}</span>;
}
