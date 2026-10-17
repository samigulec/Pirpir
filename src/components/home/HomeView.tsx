"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { coreCityByCode } from "@/data/airports-core";
import { HomeHero } from "./HomeHero";
import { MobileDeal } from "./MobileDeal";
import { PopularFlights } from "./PopularFlights";
import type { AirportValue } from "./AirportField";
import { DEFAULT_FROM, type PopularDestination } from "@/data/mock/home";
import type { DealMap } from "@/lib/deals";

/** Arama kutusu ile "… çıkışlı" başlığı aynı "Nereden" değerini paylaşır; kartların fiyatları da o yerden. */
export function HomeView({
  destinations,
  deals: initialDeals,
  live,
  defaults,
}: {
  destinations: PopularDestination[];
  /** DEFAULT_FROM çıkışlı fırsatlar (sunucuda hesaplanır) */
  deals: DealMap;
  live: boolean;
  defaults: { date: string; returnDate: string; today: string };
}) {
  const locale = useLocale();
  const [from, setFrom] = useState<AirportValue>([{ code: DEFAULT_FROM, label: coreCityByCode(DEFAULT_FROM, locale) }]);
  const [to, setTo] = useState<AirportValue>([{ code: "ADB", label: coreCityByCode("ADB", locale) }]);
  const fromCodes = from.length ? from.map((p) => p.code) : [DEFAULT_FROM];
  const key = fromCodes.join(",");
  const [loaded, setLoaded] = useState({ key: DEFAULT_FROM, deals: initialDeals });

  // Kalkış yeri değişince fırsatlar o yer için yeniden alınır
  useEffect(() => {
    if (key === loaded.key) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/deals?from=${encodeURIComponent(key)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { deals: {} }))
        .then((res: { deals: DealMap }) => setLoaded({ key, deals: res.deals }))
        .catch(() => {
          if (!ctrl.signal.aborted) setLoaded({ key, deals: {} });
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [key, loaded.key]);

  return (
    <>
      <HomeHero from={from} to={to} onFrom={setFrom} onTo={setTo} defaults={defaults} afterHero={<MobileDeal deal={initialDeals.fco ?? null} />} />
      <PopularFlights
        fromLabel={from.map((p) => p.label).join(", ") || coreCityByCode(DEFAULT_FROM, locale)}
        fromCodes={fromCodes}
        destinations={destinations}
        deals={loaded.deals}
        loading={loaded.key !== key}
        live={live}
      />
    </>
  );
}
