"use client";

import { Suspense, use, useEffect, useState, type ComponentProps } from "react";
import { useLocale } from "next-intl";
import { coreCityByCode } from "@/data/airports-core";
import { HomeHero } from "./HomeHero";
import { MobileDeal } from "./MobileDeal";
import { PopularFlights } from "./PopularFlights";
import type { AirportValue } from "./AirportField";
import type { PopularDestination } from "@/data/mock/home";
import type { DealMap } from "@/lib/deals";

/**
 * Arama kutusu ile "… çıkışlı" başlığı aynı "Nereden" değerini paylaşır; kartların fiyatları da o yerden.
 * Fiyatlar sayfayı bekletmez: sunucu sayfayı hemen gönderir, `deals` sözü (Promise) hazır olunca kartlar dolar.
 */
export function HomeView({
  destinations,
  deals,
  live,
  defaults,
  defaultFrom: DEFAULT_FROM,
}: {
  destinations: PopularDestination[];
  /** `defaultFrom` çıkışlı fırsatlar (sunucuda hesaplanır, akışla gelir) */
  deals: Promise<DealMap>;
  live: boolean;
  defaults: { today: string };
  /** Ziyaretçinin ülkesine göre kalkış yeri; varış boş başlar (herkese aynı şehri önermeyelim) */
  defaultFrom: string;
}) {
  const locale = useLocale();
  const [from, setFrom] = useState<AirportValue>([{ code: DEFAULT_FROM, label: coreCityByCode(DEFAULT_FROM, locale) }]);
  const [to, setTo] = useState<AirportValue>([]);
  const fromCodes = from.length ? from.map((p) => p.code) : [DEFAULT_FROM];
  const fromLabel = from.map((p) => p.label).join(", ") || coreCityByCode(DEFAULT_FROM, locale);
  const flights = { fromLabel, fromCodes, destinations, live };

  return (
    <>
      <HomeHero
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        defaults={defaults}
        afterHero={
          <Suspense fallback={<MobileDeal deal={null} from={fromCodes} />}>
            <MobileDealFrom deals={deals} from={fromCodes} />
          </Suspense>
        }
      />
      <Suspense fallback={<PopularFlights {...flights} deals={{}} loading />}>
        <LiveFlights {...flights} initial={deals} defaultFrom={DEFAULT_FROM} />
      </Suspense>
    </>
  );
}

function MobileDealFrom({ deals, from }: { deals: Promise<DealMap>; from: string[] }) {
  return <MobileDeal deal={use(deals).fco ?? null} from={from} />;
}

/** Popüler uçuş kartları: sunucudan gelen fiyatlarla başlar, kalkış yeri değişince o yer için yeniden alınır. */
function LiveFlights({
  initial,
  defaultFrom: DEFAULT_FROM,
  ...props
}: Omit<ComponentProps<typeof PopularFlights>, "deals" | "loading"> & { initial: Promise<DealMap>; defaultFrom: string }) {
  const first = use(initial);
  const key = props.fromCodes.join(",");
  const [loaded, setLoaded] = useState({ key: DEFAULT_FROM, deals: first });

  // Sunucunun süresi içinde bitmeyen kartlar tamamlanır, diğerleri arama önbelleğinin güncel fiyatıyla
  // eşitlenir (karta tıklayınca açılan aramadaki fiyatla aynı olsun).
  useEffect(() => {
    fetch(`/api/deals?from=${encodeURIComponent(DEFAULT_FROM)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res: { deals: DealMap } | null) => {
        if (res) setLoaded((l) => (l.key === DEFAULT_FROM ? { key: l.key, deals: { ...l.deals, ...stripNulls(res.deals) } } : l));
      })
      .catch(() => {});
  }, [DEFAULT_FROM]);

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

  return <PopularFlights {...props} deals={loaded.deals} loading={loaded.key !== key} />;
}

const stripNulls = (m: DealMap): DealMap => Object.fromEntries(Object.entries(m).filter(([, v]) => v));
