"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import type { FareConditions } from "@/lib/providers/types";

/** "Değişiklik ücreti ₺1.600 + varsa fiyat farkı" gibi: havayolunun bildirdiği ceza varsa tutarıyla. */
export function useConditionText(namespace: "results.trip" | "results.conditions") {
  const t = useTranslations(namespace);
  const { fmt } = useCurrency();
  return (c: FareConditions, kind: "change" | "refund") => {
    if (kind === "change") {
      if (!c.changeable) return t("notChangeable");
      if (c.changeFee === 0) return t("changeFree");
      return c.changeFee !== undefined ? t("changeFee", { fee: fmt(c.changeFee) }) : t("changeable");
    }
    if (!c.refundable) return t("nonRefundable");
    if (c.refundFee === 0) return t("refundFree");
    return c.refundFee !== undefined ? t("refundFee", { fee: fmt(c.refundFee) }) : t("refundable");
  };
}
