"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { useCurrency } from "../CurrencyProvider";

/** Seyahat planı PDF'i: sayfanın dili ve seçili para birimiyle indirilir. */
export function PdfLink({ bookingId, className, children }: { bookingId: string; className: string; children: ReactNode }) {
  const locale = useLocale();
  const { cur } = useCurrency();
  return (
    <a href={`/api/bilet-pdf/${encodeURIComponent(bookingId)}?lang=${locale}&cur=${cur}`} download className={className}>
      {children}
    </a>
  );
}
