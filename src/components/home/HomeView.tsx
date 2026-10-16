"use client";

import { useState } from "react";
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
  const [from, setFrom] = useState<AirportValue>({ text: "Amsterdam", code: "AMS" });
  const [to, setTo] = useState<AirportValue>({ text: "İzmir", code: "ADB" });
  return (
    <>
      <HomeHero from={from} to={to} onFrom={setFrom} onTo={setTo} defaults={defaults} afterHero={<MobileDeal />} />
      <PopularFlights fromLabel={from.text || "Amsterdam"} fromCode={from.code ?? "AMS"} destinations={destinations} />
    </>
  );
}
