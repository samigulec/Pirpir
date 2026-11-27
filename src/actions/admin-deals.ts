"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/admin";
import { scanDeals, type DealScanSummary } from "@/lib/deal-scanner";
import { setDealStatus, type DealStatus } from "@/lib/deal-store";

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

export const approveDeal = (id: string) => changeStatus(id, "published");
export const rejectDeal = (id: string) => changeStatus(id, "rejected");
export const restoreDeal = (id: string) => changeStatus(id, "candidate");

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
