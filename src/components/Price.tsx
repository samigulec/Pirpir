"use client";

import { useCurrency } from "./CurrencyProvider";

/** Sunucu bileşenlerinden fiyat göstermek için: seçili para birimine anında çevrilir. */
export function Price({ amount }: { amount: number }) {
  const { fmt } = useCurrency();
  // Akışlı Suspense sınırları tarayıcı para birimi (ör. NL → EUR) oturduktan sonra hidrate olabilir
  return <span suppressHydrationWarning>{fmt(amount)}</span>;
}
