// Tamamlanan rezervasyonun özeti. Hesap/veritabanı (Supabase) gelene kadar tarayıcıda
// httpOnly çerezde tutulur; onay sayfası buradan okur.
import "server-only";
import { cookies } from "next/headers";
import type { Booking } from "./providers/types";

const COOKIE = "rotala_booking";

export async function saveBooking(b: Booking) {
  const jar = await cookies();
  jar.set(COOKIE, Buffer.from(JSON.stringify(b)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function readBooking(id: string): Promise<Booking | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const b = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Booking;
    return b.id === id ? b : null;
  } catch {
    return null;
  }
}
