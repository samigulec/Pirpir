"use client";

import { useCurrency } from "./CurrencyProvider";

/** Sunucu bileşenlerinden fiyat göstermek için: seçili para birimine anında çevrilir. */
export function Price({ amount }: { amount: number }) {
  const { fmt } = useCurrency();
  return <>{fmt(amount)}</>;
}
