"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cityByCode } from "@/data/airports";
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
  const [from, setFrom] = useState<AirportValue>({ text: cityByCode("AMS", locale), code: "AMS" });
  const [to, setTo] = useState<AirportValue>({ text: cityByCode("ADB", locale), code: "ADB" });
  return (
    <>
      <HomeHero from={from} to={to} onFrom={setFrom} onTo={setTo} defaults={defaults} afterHero={<MobileDeal />} />
      <PopularFlights fromLabel={from.text || cityByCode("AMS", locale)} fromCode={from.code ?? "AMS"} destinations={destinations} />
    </>
  );
}
