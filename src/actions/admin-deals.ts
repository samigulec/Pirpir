"use server";

import { revalidatePath } from "next/cache";
import { cityByCode } from "@/data/airports";
import { getAdminUser } from "@/lib/auth/admin";
import { scanDeals, type DealScanSummary } from "@/lib/deal-scanner";
import { getPublishedDeal, setDealStatus, type DealStatus } from "@/lib/deal-store";
import { isTelegramConfigured, postDealToTelegram } from "@/lib/telegram";

type ActionResult = { ok: true } | { ok: false; error: string };

async function changeStatus(id: string, status: DealStatus): Promise<ActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetkisiz işlem." };
  const ok = await setDealStatus(id, status);
  if (!ok) return { ok: false, error: "Durum güncellenemedi." };
  revalidatePath("/yonetim/firsatlar");
  revalidatePath("/firsatlar");
  revalidatePath("/");
  return { ok: true };
}

export async function approveDeal(id: string): Promise<ActionResult> {
  const res = await changeStatus(id, "published");
  if (res.ok && isTelegramConfigured()) {
    try {
      const found = await getPublishedDeal(id);
      if (found) {
        const { deal } = found;
        await postDealToTelegram({
          ...deal,
          fromCity: cityByCode(deal.origin, "tr"),
          toCity: cityByCode(deal.destination, "tr"),
        });
      }
    } catch (e) {
      console.error("Telegram bildirim akışı hatası:", e instanceof Error ? e.message : e);
    }
  }
  return res;
}

export async function rejectDeal(id: string): Promise<ActionResult> {
  return changeStatus(id, "rejected");
}

export async function restoreDeal(id: string): Promise<ActionResult> {
  return changeStatus(id, "candidate");
}

export async function triggerDealScan(): Promise<{ ok: true; summary: DealScanSummary } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Yetkisiz işlem." };
  try {
    const summary = await scanDeals();
    revalidatePath("/yonetim/firsatlar");
    return { ok: true, summary };
  } catch (e) {
    console.error("Elle fırsat taraması hatası:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Tarama sırasında bir hata oluştu." };
  }
}
