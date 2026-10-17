"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { deleteItem, listItems, NotSignedInError, saveItem } from "@/lib/user-items";
import { searchFlightsCached } from "@/lib/flights";
import { cheapestWithBags } from "@/lib/extras";
import { knownDayPrice } from "@/lib/price-calendar";
import { isKnownPlace } from "@/data/airports";
import { favoriteKey, type Favorite, type PriceAlert, type Saved, type Traveller } from "@/lib/user-types";
import { CABINS, todayIso, validateSearch, type MultiQuery } from "@/lib/search";

export type UserResult<T> = { ok: true; value: T } | { ok: false; error: "signIn" | "invalid" | "failed" };

const fail = (e: unknown): UserResult<never> => {
  if (e instanceof NotSignedInError) return { ok: false, error: "signIn" };
  console.error(e);
  return { ok: false, error: "failed" };
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const clean = (v: unknown, max = 60) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

// --- Kayıtlı yolcular ---

function parseTraveller(raw: Traveller): Traveller | null {
  const t: Traveller = {
    givenName: clean(raw.givenName),
    familyName: clean(raw.familyName),
    gender: raw.gender === "m" ? "m" : "f",
    bornOn: clean(raw.bornOn, 10),
    nationality: clean(raw.nationality, 40),
    passport: clean(raw.passport, 20).toUpperCase() || undefined,
  };
  if (!t.givenName || !t.familyName || !ISO.test(t.bornOn) || t.bornOn > todayIso()) return null;
  return t;
}

export async function getTravellers(): Promise<UserResult<Saved<Traveller>[]>> {
  if (!(await getCurrentUser())) return { ok: false, error: "signIn" };
  return { ok: true, value: await listItems<Traveller>("traveller") };
}

export async function saveTraveller(raw: Traveller, id?: string): Promise<UserResult<Saved<Traveller>>> {
  const t = parseTraveller(raw);
  if (!t) return { ok: false, error: "invalid" };
  try {
    // Aynı kişi (ad, soyad, doğum tarihi) iki kez kaydedilmez; varsa güncellenir
    const same = id ? undefined : (await listItems<Traveller>("traveller")).find(
      (x) => x.data.givenName.toLocaleLowerCase("tr") === t.givenName.toLocaleLowerCase("tr") &&
        x.data.familyName.toLocaleLowerCase("tr") === t.familyName.toLocaleLowerCase("tr") && x.data.bornOn === t.bornOn,
    );
    return { ok: true, value: await saveItem("traveller", t, id ?? same?.id) };
  } catch (e) {
    return fail(e);
  }
}

export async function removeTraveller(id: string): Promise<UserResult<true>> {
  try {
    await deleteItem("traveller", id);
    return { ok: true, value: true };
  } catch (e) {
    return fail(e);
  }
}

// --- Fiyat alarmları ---

function parseAlertQuery(q: MultiQuery): MultiQuery | null {
  const from = q.from.filter((c) => isKnownPlace(c)).slice(0, 3);
  const to = q.to.filter((c) => isKnownPlace(c)).slice(0, 3);
  const cabin = CABINS.includes(q.cabin ?? "economy") ? (q.cabin ?? "economy") : "economy";
  const c: MultiQuery = { from, to, date: q.date, returnDate: q.returnDate || undefined, pax: q.pax, cabin };
  return validateSearch(c, isKnownPlace) ? null : c;
}

export async function createAlert(q: MultiQuery): Promise<UserResult<Saved<PriceAlert>>> {
  const c = parseAlertQuery(q);
  if (!c) return { ok: false, error: "invalid" };
  try {
    const existing = (await listItems<PriceAlert>("alert")).find(
      (a) => a.data.from.join() === c.from.join() && a.data.to.join() === c.to.join() && a.data.date === c.date && a.data.returnDate === c.returnDate,
    );
    if (existing) return { ok: true, value: existing };
    // Fiyat, sonuç sayfasının az önce yaptığı (önbellekteki) aramadan
    const priceAt = await searchFlightsCached(c).then((o) => cheapestWithBags(o)).catch(() => null);
    return { ok: true, value: await saveItem<PriceAlert>("alert", { from: c.from, to: c.to, date: c.date, returnDate: c.returnDate, cabin: c.cabin ?? "economy", pax: c.pax, priceAt }) };
  } catch (e) {
    return fail(e);
  }
}

export type AlertView = Saved<PriceAlert> & { now: number | null; past: boolean };

/** Alarmlar ve bilinen güncel fiyat (yeni arama yapılmaz; son 24 saatte bulunan fiyat). */
export async function getAlerts(): Promise<UserResult<AlertView[]>> {
  if (!(await getCurrentUser())) return { ok: false, error: "signIn" };
  const list = await listItems<PriceAlert>("alert");
  const today = todayIso();
  const views = await Promise.all(
    list.map(async (a) => {
      const past = a.data.date < today;
      const now = past ? null : await knownDayPrice({ ...a.data }).catch(() => null);
      return { ...a, now, past };
    }),
  );
  return { ok: true, value: views };
}

export async function removeAlert(id: string): Promise<UserResult<true>> {
  try {
    await deleteItem("alert", id);
    return { ok: true, value: true };
  } catch (e) {
    return fail(e);
  }
}

// --- Favoriler ---

export async function getFavorites(): Promise<UserResult<Saved<Favorite>[]>> {
  if (!(await getCurrentUser())) return { ok: false, error: "signIn" };
  return { ok: true, value: await listItems<Favorite>("favorite") };
}

/** Uçuşu favorilere ekler; zaten varsa çıkarır. Dönen değer: artık favori mi. */
export async function toggleFavorite(f: Favorite): Promise<UserResult<boolean>> {
  try {
    const key = favoriteKey(f);
    const list = await listItems<Favorite>("favorite");
    const existing = list.find((x) => x.data.key === key);
    if (existing) {
      await deleteItem("favorite", existing.id);
      return { ok: true, value: false };
    }
    if (!Number.isFinite(f.price) || f.price < 0 || !ISO.test(f.query.date)) return { ok: false, error: "invalid" };
    await saveItem<Favorite>("favorite", { ...f, key });
    return { ok: true, value: true };
  } catch (e) {
    return fail(e);
  }
}

export async function removeFavorite(id: string): Promise<UserResult<true>> {
  try {
    await deleteItem("favorite", id);
    return { ok: true, value: true };
  } catch (e) {
    return fail(e);
  }
}
