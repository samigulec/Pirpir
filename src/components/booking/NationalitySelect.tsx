"use client";

import { useTranslations } from "next-intl";
import type { countryOptions } from "@/data/countries";

export type CountryOptions = ReturnType<typeof countryOptions>;

/**
 * Uyruk seçimi: önce sık seçilen ülkeler, sonra tüm ülkeler. Adlar sunucuda sayfa dilinde hazırlanıp
 * gelir (tarayıcının Intl verisi farklı olabilir; sunucu ve tarayıcı aynı metni çizsin).
 */
export function NationalitySelect({
  options,
  className,
  ...props
}: { options: CountryOptions; className: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children">) {
  const t = useTranslations("booking.passenger");
  return (
    <select className={className} {...props}>
      <option value="" disabled>
        {t("nationalityPick")}
      </option>
      <optgroup label={t("nationalityCommon")}>
        {options.common.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </optgroup>
      <optgroup label={t("nationalityAll")}>
        {options.all.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </optgroup>
    </select>
  );
}
