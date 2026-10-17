"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { CabinBagIcon, CheckedBagIcon, PersonalItemIcon } from "./BagIcons";
import type { BagSpec, Offer } from "@/lib/providers/types";

/** "55×40×20 cm" ya da "en+boy+yükseklik en fazla 158 cm" */
export function useBagSpecText() {
  const t = useTranslations("results.bagRules");
  return {
    weight: (s?: BagSpec) => (s?.kg ? t("kg", { kg: s.kg }) : undefined),
    size: (s?: BagSpec) => (s?.dims ? t("dims", { dims: s.dims.join("×") }) : s?.linearCm ? t("linear", { cm: s.linearCm }) : undefined),
  };
}

/**
 * Bagaj kuralları tablosu (Kiwi'deki ayrıntı gibi): her tür için dahil mi / eklenebilir mi,
 * en fazla ağırlık ve ölçü. Havayolu bildirmediyse uydurulmaz, "bildirilmedi" yazılır.
 */
export function BagRules({ offer }: { offer: Offer }) {
  const t = useTranslations("results.bagRules");
  const tb = useTranslations("results.bags");
  const { fmt } = useCurrency();
  const spec = useBagSpecText();
  const s = offer.bagSpecs ?? {};
  const b = offer.bags;

  const status = (included: number, price: number | undefined, max: number) =>
    included > 0
      ? { ok: true, text: included > 1 ? t("includedN", { n: included }) : t("included") }
      : price !== undefined && max > 0
        ? { ok: false, text: t("addable", { price: fmt(price) }) }
        : { ok: false, text: t("notAvailable") };

  const rows = [
    { key: "personal", icon: <PersonalItemIcon />, label: tb("personal"), st: { ok: true, text: t("included") }, spec: s.personal, note: t("personalNote") },
    { key: "cabin", icon: <CabinBagIcon />, label: tb("cabin"), st: status(b.cabin.included, b.cabin.price, b.cabin.max), spec: s.cabin },
    { key: "checked", icon: <CheckedBagIcon />, label: tb("checked"), st: status(b.checked.included, b.checked.price, b.checked.max), spec: s.checked },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-extrabold text-muted">{t("title")}</span>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
          <thead>
            <tr className="text-[12px] font-extrabold uppercase text-muted">
              <th className="py-1 pr-3 font-extrabold">{t("type")}</th>
              <th className="py-1 pr-3 font-extrabold">{t("status")}</th>
              <th className="py-1 pr-3 font-extrabold">{t("weight")}</th>
              <th className="py-1 font-extrabold">{t("size")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-0 border-t border-solid border-line align-top">
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2 font-extrabold">{r.icon}{r.label}</span>
                  {r.note && <span className="block text-[12px] font-semibold text-muted">{r.note}</span>}
                </td>
                <td className={`py-2 pr-3 font-bold ${r.st.ok ? "text-green-text" : "text-muted"}`}>{r.st.text}</td>
                <td className="py-2 pr-3 font-bold">{spec.weight(r.spec) ?? (r.key === "personal" ? "—" : t("unknown"))}</td>
                <td className="py-2 font-bold">{spec.size(r.spec) ?? t("unknown")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="text-[12px] font-semibold text-muted">{t("note")}</span>
    </div>
  );
}
