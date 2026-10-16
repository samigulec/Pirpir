// Rezervasyonların saklanması.
// - Her zaman: bu tarayıcıda son rezervasyonlar (httpOnly çerez) → misafir de onay sayfasını görür.
// - Supabase yapılandırılmışsa: "bookings" tablosu → giriş yapan kullanıcı tüm biletlerini her cihazda görür.
import "server-only";
import { cookies } from "next/headers";
import { supabaseAdmin, supabaseServer } from "./auth/supabase-server";
import { isSupabaseConfigured } from "./auth/config";
import type { CurrentUser } from "./auth/session";
import type { Booking, Leg } from "./providers/types";

const COOKIE = "rotala_bookings";
const MAX_IN_COOKIE = 4;

// Çerez 4 KB ile sınırlı: bacaklar kısa anahtarlarla saklanır, şehir adları koddan türetilir.
type CompactLeg = [string, string, string, number, string, string, string, number, string?, number?];
type CompactBooking = { i: string; p: Booking["provider"]; r?: string; e: string; t: number; c: string; a: string; o: CompactLeg; b?: CompactLeg };

const packLeg = (l: Leg): CompactLeg => [l.date, l.dep, l.arr, l.arrDayOffset, l.fromCode, l.toCode, l.airline, l.stops, l.via?.code, l.mins];
const unpackLeg = (c: CompactLeg): Leg => ({
  date: c[0], dep: c[1], arr: c[2], arrDayOffset: c[3], fromCode: c[4], toCode: c[5], fromCity: c[4], toCity: c[5],
  airline: c[6], stops: c[7], via: c[8] ? { code: c[8], city: c[8], waitMins: 0 } : undefined, mins: c[9] ?? 0,
});
const pack = (b: Booking): CompactBooking => ({
  i: b.id, p: b.provider, r: b.pnr, e: b.email, t: b.total, c: b.createdAt, a: b.offer.airline,
  o: packLeg(b.offer.outbound), b: b.offer.inbound ? packLeg(b.offer.inbound) : undefined,
});
const unpack = (c: CompactBooking): Booking => ({
  id: c.i, provider: c.p, pnr: c.r, email: c.e, total: c.t, createdAt: c.c,
  offer: { airline: c.a, outbound: unpackLeg(c.o), inbound: c.b ? unpackLeg(c.b) : undefined },
});

async function readCookieList(): Promise<Booking[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    return (JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as CompactBooking[]).map(unpack);
  } catch {
    return [];
  }
}

type Row = { id: string; email: string; provider: string; pnr: string | null; total_try: number; summary: Booking; created_at: string };

const fromRow = (r: Row): Booking => ({ ...r.summary, id: r.id, pnr: r.pnr ?? undefined, email: r.email, total: r.total_try, createdAt: r.created_at });

export async function saveBooking(b: Booking, user: CurrentUser | null, locale: string) {
  const list = [b, ...(await readCookieList()).filter((x) => x.id !== b.id)].slice(0, MAX_IN_COOKIE);
  (await cookies()).set(COOKIE, Buffer.from(JSON.stringify(list.map(pack))).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const admin = supabaseAdmin();
  if (admin) {
    const { error } = await admin.from("bookings").insert({
      id: b.id,
      user_id: user?.mode === "supabase" ? user.id : null,
      email: b.email.toLowerCase(),
      provider: b.provider,
      pnr: b.pnr ?? null,
      total_try: b.total,
      locale,
      summary: b,
    });
    // Kayıt başarısız olsa da bilet kesildi; kullanıcıyı durdurmayalım, sadece günlüğe yazalım.
    if (error) console.error("Rezervasyon veritabanına yazılamadı:", error.message);
  }
}

/** Bu tarayıcıdaki ya da (girişliyse) hesaptaki rezervasyon. */
export async function getBooking(id: string): Promise<Booking | null> {
  const local = (await readCookieList()).find((b) => b.id === id);
  if (local) return local;
  if (!isSupabaseConfigured()) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle<Row>();
  return data ? fromRow(data) : null;
}

/** Biletlerim: hesaptaki (RLS ile kullanıcıya ait olanlar) + bu tarayıcıdakiler. */
export async function listBookings(user: CurrentUser | null): Promise<Booking[]> {
  const local = await readCookieList();
  let remote: Booking[] = [];
  if (user?.mode === "supabase") {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) console.error("Biletler okunamadı:", error.message);
    remote = (data as Row[] | null)?.map(fromRow) ?? [];
  }
  const mine = user ? local.filter((b) => b.email.toLowerCase() === user.email.toLowerCase()) : local;
  const all = [...remote, ...mine.filter((b) => !remote.some((r) => r.id === b.id))];
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
