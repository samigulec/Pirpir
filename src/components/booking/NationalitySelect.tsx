"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Picker, type PickerItem } from "../Picker";
import type { countryOptions } from "@/data/countries";

export type CountryOptions = ReturnType<typeof countryOptions>;

/**
 * Uyruk seçimi: yazarak aranan, bayraklı liste; önce sık seçilenler, sonra tüm ülkeler.
 * Adlar sunucuda sayfa dilinde hazırlanıp gelir (sunucu ve tarayıcı aynı metni çizsin).
 */
export function NationalitySelect({
  options,
  value,
  onChange,
  name,
  className,
  labelId,
}: {
  options: CountryOptions;
  value: string;
  onChange: (code: string) => void;
  name?: string;
  className: string;
  labelId: string;
}) {
  const t = useTranslations("booking.passenger");
  const items = useMemo<PickerItem[]>(
    () => [
      ...options.common.map((c) => ({ value: c.code, label: c.name, icon: { flag: c.code }, group: t("nationalityCommon"), keywords: c.code })),
      ...options.all.map((c) => ({ value: c.code, label: c.name, icon: { flag: c.code }, group: t("nationalityAll"), keywords: c.code })),
    ],
    [options, t],
  );
  return (
    <Picker
      items={items}
      value={value}
      onChange={onChange}
      name={name}
      labelId={labelId}
      className={className}
      placeholder={t("nationalityPick")}
      searchPlaceholder={t("nationalitySearch")}
      emptyText={t("nationalityNone")}
    />
  );
}
