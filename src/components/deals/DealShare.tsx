"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";

export function DealShare({
  route,
  priceTry,
  dates,
  url,
}: {
  route: string;
  priceTry: number;
  dates: string;
  url: string;
}) {
  const t = useTranslations("deals");
  const { fmt } = useCurrency();
  const [copied, setCopied] = useState(false);

  const text = t("shareText", { route, price: fmt(priceTry), dates, url });
  const waHref = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${route} · ${fmt(priceTry)} (${dates})`)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Pano erişimi yoksa sessizce geç
    }
  };

  return (
    <section aria-label={t("shareTitle")} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border-2 border-solid border-line bg-white px-5 py-4">
      <span className="font-display text-lg font-bold text-ink">{t("shareTitle")}</span>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-pill bg-green-soft px-4 font-display text-[15px] font-semibold text-green-text no-underline"
        >
          {t("shareWhatsApp")}
        </a>
        <a
          href={tgHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-pill bg-sky px-4 font-display text-[15px] font-semibold text-ink no-underline"
        >
          {t("shareTelegram")}
        </a>
        <button
          type="button"
          onClick={copy}
          className="min-h-[44px] cursor-pointer rounded-pill border-2 border-solid border-line bg-white px-4 font-display text-[15px] font-semibold text-ink hover:border-primary"
        >
          {copied ? `✓ ${t("shareCopied")}` : t("shareCopy")}
        </button>
      </div>
    </section>
  );
}
