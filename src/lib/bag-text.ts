import type { BagItem } from "./trips";

type T = (key: string, values?: Record<string, string | number>) => string;

/** "Kabin bagajı · 8 kg" · "2× kontrol edilen bagaj · 23 kg" · "Kişisel eşya" (confirm.bagsText çevirileriyle) */
export function bagItemText(t: T, item: BagItem): string {
  const label = t(`items.${item.kind}`, { n: item.count });
  return item.kg ? t("withKg", { item: label, kg: item.kg }) : label;
}
