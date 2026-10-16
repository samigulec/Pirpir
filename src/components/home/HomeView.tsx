"use client";

import { useState } from "react";
import { HomeHero } from "./HomeHero";
import { MobileDeal } from "./MobileDeal";
import { PopularFlights } from "./PopularFlights";
import type { PopularDestination } from "@/data/mock/home";

/** Arama kutusu ile "… çıkışlı" başlığı aynı "Nereden" değerini paylaşır. */
export function HomeView({
  destinations,
  defaults,
}: {
  destinations: PopularDestination[];
  defaults: { from: string; to: string; date: string; returnDate: string };
}) {
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  return (
    <>
      <HomeHero from={from} to={to} onFrom={setFrom} onTo={setTo} defaults={defaults} afterHero={<MobileDeal />} />
      <PopularFlights fromLabel={from || defaults.from} destinations={destinations} />
    </>
  );
}
