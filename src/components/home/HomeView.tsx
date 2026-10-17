"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { coreCityByCode } from "@/data/airports-core";
import { HomeHero } from "./HomeHero";
import { MobileDeal } from "./MobileDeal";
import { PopularFlights } from "./PopularFlights";
import type { AirportValue } from "./AirportField";
import type { PopularDestination } from "@/data/mock/home";

/** Arama kutusu ile "… çıkışlı" başlığı aynı "Nereden" değerini paylaşır. */
export function HomeView({
  destinations,
  defaults,
}: {
  destinations: PopularDestination[];
  defaults: { date: string; returnDate: string; today: string };
}) {
  const locale = useLocale();
  const [from, setFrom] = useState<AirportValue>([{ code: "AMS", label: coreCityByCode("AMS", locale) }]);
  const [to, setTo] = useState<AirportValue>([{ code: "ADB", label: coreCityByCode("ADB", locale) }]);
  return (
    <>
      <HomeHero from={from} to={to} onFrom={setFrom} onTo={setTo} defaults={defaults} afterHero={<MobileDeal />} />
      <PopularFlights fromLabel={from.map((p) => p.label).join(", ") || coreCityByCode("AMS", locale)}
        fromCodes={from.length ? from.map((p) => p.code) : ["AMS"]} destinations={destinations} />
    </>
  );
}
