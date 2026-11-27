// Yerel Travelpayouts sahte sunucusu (test verisi).
// E2E "affiliate" projesi gerçek API'ye çıkmadan bu sunucudan gerçekçi Aviasales v3 yanıtları alır.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "travelpayouts-data.json"), "utf8"));
const PORT = Number(process.env.MOCK_TP_PORT || 3119);

const pad2 = (n) => String(n).padStart(2, "0");

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonthsYm(todayIso, offset) {
  const y = Number(todayIso.slice(0, 4));
  const m = Number(todayIso.slice(5, 7)) - 1 + offset;
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

function ddmm(iso) {
  return iso.slice(8, 10) + iso.slice(5, 7);
}

function searchDateToken(iso) {
  return iso.slice(8, 10) + iso.slice(5, 7) + iso.slice(0, 4);
}

function mainAirport(code) {
  const map = { ROM: "FCO", LON: "LHR", PAR: "CDG", NYC: "JFK", MIL: "MXP", STO: "ARN" };
  return map[code] || code;
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  res.setHeader("content-type", "application/json; charset=utf-8");

  if (u.pathname === "/health") {
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  const token = req.headers["x-access-token"] || u.searchParams.get("token");
  if (!token) {
    res.statusCode = 401;
    res.end(JSON.stringify({ success: false, error: "missing token" }));
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const seenDay = addDays(today, -1); // dün görüldü (taze önbellek)
  const seenParam = searchDateToken(seenDay);

  if (u.pathname === "/aviasales/v3/grouped_prices") {
    const origin = (u.searchParams.get("origin") || "AMS").toUpperCase();
    const dest = (u.searchParams.get("destination") || "IST").toUpperCase();
    const groupBy = u.searchParams.get("group_by") || "departure_at";
    const directOnly = u.searchParams.get("direct") === "true";
    const depParam = u.searchParams.get("departure_at") || "";
    const retParam = u.searchParams.get("return_at") || "";
    const minDur = Number(u.searchParams.get("min_trip_duration") || 0);
    const maxDur = Number(u.searchParams.get("max_trip_duration") || 0);
    const data = {};

    if (groupBy === "month") {
      // Kasıtlı olarak yalnızca 4 ay doldurulur; kalan 8 ay boş ("Fiyata bak") kalır
      for (const item of fixture.monthly) {
        if (directOnly && item.transfers > 0) continue;
        const ym = addMonthsYm(today, item.monthOffset);
        const dep = `${ym}-${pad2(item.day)}`;
        const ret = addDays(dep, item.nights);
        data[ym] = {
          origin,
          destination: dest,
          origin_airport: mainAirport(origin),
          destination_airport: mainAirport(dest),
          price: item.priceEur,
          airline: item.airline,
          departure_at: `${dep}T10:15:00+01:00`,
          return_at: `${ret}T14:30:00+03:00`,
          transfers: item.transfers,
          return_transfers: item.transfers,
          duration_to: item.durationTo,
          duration_back: item.durationTo + 10,
          found_at: `${seenDay}T09:00:00Z`,
          link: `/search/${origin}${ddmm(dep)}${dest}${ddmm(ret)}1?t=${item.airline}_test&search_date=${seenParam}`,
        };
      }
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // group_by=departure_at
    const ym = /^\d{4}-\d{2}/.test(depParam) ? depParam.slice(0, 7) : addMonthsYm(today, 1);
    const isRoundTrip = Boolean(retParam || minDur > 0 || maxDur > 0);
    for (const item of fixture.dailyInMonth) {
      if (directOnly && item.transfers > 0) continue;
      const dep = `${ym}-${pad2(item.day)}`;
      const nights = minDur > 0 && maxDur > 0 ? Math.min(maxDur, Math.max(minDur, item.nights)) : item.nights;
      const ret = isRoundTrip ? addDays(dep, nights) : undefined;
      data[dep] = {
        origin,
        destination: dest,
        origin_airport: mainAirport(origin),
        destination_airport: mainAirport(dest),
        price: item.priceEur,
        airline: item.airline,
        departure_at: `${dep}T08:45:00+01:00`,
        ...(ret ? { return_at: `${ret}T15:10:00+03:00` } : {}),
        transfers: item.transfers,
        ...(ret ? { return_transfers: item.transfers } : {}),
        duration_to: item.durationTo,
        ...(ret ? { duration_back: item.durationTo + 10 } : {}),
        found_at: `${seenDay}T08:30:00Z`,
        link: `/search/${origin}${ddmm(dep)}${dest}${ret ? ddmm(ret) : ""}1?t=${item.airline}_test&search_date=${seenParam}`,
      };
    }
    res.end(JSON.stringify({ success: true, data }));
    return;
  }

  if (u.pathname === "/aviasales/v3/prices_for_dates") {
    const origin = (u.searchParams.get("origin") || "AMS").toUpperCase();
    const dest = (u.searchParams.get("destination") || "IST").toUpperCase();
    const depRaw = u.searchParams.get("departure_at") || addDays(today, 21);
    const retRaw = u.searchParams.get("return_at") || "";
    const oneWay = u.searchParams.get("one_way") === "true";
    const directOnly = u.searchParams.get("direct") === "true";
    const dep = /^\d{4}-\d{2}-\d{2}$/.test(depRaw) ? depRaw : `${depRaw.slice(0, 7)}-21`;
    const ret = !oneWay ? (/^\d{4}-\d{2}-\d{2}$/.test(retRaw) ? retRaw : addDays(dep, 7)) : undefined;

    const list = fixture.pricesForDates
      .filter((x) => !directOnly || x.transfers === 0)
      .map((x) => ({
        origin,
        destination: dest,
        origin_airport: mainAirport(origin),
        destination_airport: mainAirport(dest),
        price: x.priceEur,
        airline: x.airline,
        flight_number: x.flightNumber,
        departure_at: `${dep}T${x.depHour}:00+01:00`,
        ...(ret ? { return_at: `${ret}T16:20:00+03:00` } : {}),
        transfers: x.transfers,
        ...(ret ? { return_transfers: x.transfers } : {}),
        duration: x.durationTo + (ret ? x.durationBack : 0),
        duration_to: x.durationTo,
        ...(ret ? { duration_back: x.durationBack } : {}),
        link: `/search/${origin}${ddmm(dep)}${dest}${ret ? ddmm(ret) : ""}1?t=${x.airline}_test&search_date=${seenParam}`,
      }));
    res.end(JSON.stringify({ success: true, data: list }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, error: "not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Mock Travelpayouts server listening on http://127.0.0.1:${PORT}`);
});
