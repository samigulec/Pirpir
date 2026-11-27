// Fırsat motoru veri katmanı: Supabase `deals` tablosu okuma/yazma (yalnızca service role).
import "server-only";
import { supabaseAdmin } from "./auth/supabase-server";
import { todayIso } from "./search";

export type DealStatus = "candidate" | "published" | "rejected";

export type DealRow = {
  id: string;
  origin: string;
  destination: string;
  depart: string;
  return_date: string | null;
  price_eur: number;
  median_eur: number;
  airline: string | null;
  transfers: number | null;
  seen_at: string | null;
  link: string | null;
  status: DealStatus;
  created_at: string;
  published_at: string | null;
};

export type DealCandidateInput = {
  origin: string;
  destination: string;
  depart: string;
  return_date: string | null;
  price_eur: number;
  median_eur: number;
  airline: string | null;
  transfers: number | null;
  seen_at: string | null;
  link: string | null;
};

const keyOf = (d: Pick<DealCandidateInput, "origin" | "destination" | "depart" | "return_date">) =>
  `${d.origin}|${d.destination}|${d.depart}|${d.return_date ?? ""}`;

const num = (v: unknown) => (typeof v === "number" ? v : Number(v));

function normalize(row: DealRow): DealRow {
  return {
    ...row,
    price_eur: num(row.price_eur),
    median_eur: num(row.median_eur),
    transfers: row.transfers === null || row.transfers === undefined ? null : num(row.transfers),
  };
}

/**
 * Bulunan fırsat adaylarını `deals` tablosuna işler:
 * - Daha önce reddedilmiş kayıtları yeniden aday yapmaz (`skipped`).
 * - Yayındaki kayıtların durumunu bozmaz (`skipped`).
 * - Hâlâ aday (`candidate`) olan kayıtların fiyat/görülme bilgisini günceller (`updated`).
 * - Yeni adayları ekler (`inserted`).
 */
export async function saveDealCandidates(
  candidates: DealCandidateInput[],
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const admin = supabaseAdmin();
  if (!admin || !candidates.length) return { inserted: 0, updated: 0, skipped: 0 };

  const origins = [...new Set(candidates.map((c) => c.origin))];
  const destinations = [...new Set(candidates.map((c) => c.destination))];
  const { data: existing, error: selErr } = await admin
    .from("deals")
    .select("id, origin, destination, depart, return_date, status")
    .in("origin", origins)
    .in("destination", destinations)
    .gte("depart", todayIso())
    .returns<Pick<DealRow, "id" | "origin" | "destination" | "depart" | "return_date" | "status">[]>();
  if (selErr) throw new Error(`Fırsatlar okunamadı: ${selErr.message}`);

  const byKey = new Map((existing ?? []).map((r) => [keyOf(r), r]));
  const toInsert: DealCandidateInput[] = [];
  const toUpdate: { id: string; item: DealCandidateInput }[] = [];
  let skipped = 0;

  for (const c of candidates) {
    const hit = byKey.get(keyOf(c));
    if (!hit) {
      toInsert.push(c);
    } else if (hit.status === "candidate") {
      toUpdate.push({ id: hit.id, item: c });
    } else {
      skipped++;
    }
  }

  let inserted = 0;
  if (toInsert.length) {
    const { error } = await admin.from("deals").insert(toInsert);
    if (error) throw new Error(`Fırsat adayları eklenemedi: ${error.message}`);
    inserted = toInsert.length;
  }

  let updated = 0;
  for (const u of toUpdate) {
    const { error } = await admin
      .from("deals")
      .update({
        price_eur: u.item.price_eur,
        median_eur: u.item.median_eur,
        airline: u.item.airline,
        transfers: u.item.transfers,
        seen_at: u.item.seen_at,
        link: u.item.link,
      })
      .eq("id", u.id)
      .eq("status", "candidate");
    if (error) console.error("Fırsat adayı güncellenemedi:", u.id, error.message);
    else updated++;
  }

  return { inserted, updated, skipped };
}

/** Yönetim paneli için fırsat listesi (isteğe göre durum filtreli; geçmiş tarihler hariç). */
export async function listDeals(status?: DealStatus, limit = 150): Promise<DealRow[]> {
  const admin = supabaseAdmin();
  if (!admin) return [];
  let q = admin
    .from("deals")
    .select("*")
    .gte("depart", todayIso())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) q = q.eq("status", status);
  const { data, error } = await q.returns<DealRow[]>();
  if (error) {
    console.error("Fırsatlar listelenemedi:", error.message);
    return [];
  }
  return (data ?? []).map(normalize);
}

/** Yayınlanmış, tarihi geçmemiş fırsatlar (fiyata göre ucuzdan pahalıya). */
export async function listPublishedDeals(limit = 100): Promise<DealRow[]> {
  const admin = supabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("deals")
    .select("*")
    .eq("status", "published")
    .gte("depart", todayIso())
    .order("published_at", { ascending: false })
    .order("price_eur", { ascending: true })
    .limit(limit)
    .returns<DealRow[]>();
  if (error) {
    console.error("Yayınlanmış fırsatlar okunamadı:", error.message);
    return [];
  }
  return (data ?? []).map(normalize);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tek yayınlanmış fırsat ve aynı rotanın diğer yayınlanmış tarihleri. */
export async function getPublishedDeal(id: string): Promise<{ deal: DealRow; siblings: DealRow[] } | null> {
  if (!UUID.test(id)) return null;
  const admin = supabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("deals")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle<DealRow>();
  if (error || !data) return null;
  const deal = normalize(data);
  const { data: sibs } = await admin
    .from("deals")
    .select("*")
    .eq("status", "published")
    .eq("origin", deal.origin)
    .eq("destination", deal.destination)
    .gte("depart", todayIso())
    .order("price_eur", { ascending: true })
    .order("depart", { ascending: true })
    .limit(12)
    .returns<DealRow[]>();
  const list = (sibs ?? []).map(normalize);
  if (!list.some((x) => x.id === deal.id)) list.unshift(deal);
  return { deal, siblings: list };
}

/** Yönetim panelinden bir fırsatın durumunu günceller (`published` iken `published_at` yazılır). */
export async function setDealStatus(id: string, status: DealStatus): Promise<boolean> {
  if (!UUID.test(id)) return false;
  const admin = supabaseAdmin();
  if (!admin) return false;
  const patch =
    status === "published"
      ? { status, published_at: new Date().toISOString() }
      : { status, published_at: null };
  const { error } = await admin.from("deals").update(patch).eq("id", id);
  if (error) {
    console.error("Fırsat durumu güncellenemedi:", id, error.message);
    return false;
  }
  return true;
}
