// Hesaba bağlı kayıtlar (kayıtlı yolcular, fiyat alarmları, favoriler).
// Supabase yapılandırılmışsa "user_items" tablosu (RLS: yalnızca sahibi); örnek modda bu tarayıcıdaki
// httpOnly çerez. Kayıtlar yalnızca giriş yapmış kullanıcı için tutulur.
import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { getCurrentUser, type CurrentUser } from "./auth/session";
import { supabaseServer } from "./auth/supabase-server";

export type ItemKind = "traveller" | "alert" | "favorite";
export type Item<T> = { id: string; data: T; createdAt: string };

/** Örnek modda çerez 4 KB ile sınırlı: tür başına en fazla bu kadar kayıt. */
const DEMO_MAX: Record<ItemKind, number> = { traveller: 6, alert: 8, favorite: 8 };
const LIMIT: Record<ItemKind, number> = { traveller: 20, alert: 30, favorite: 50 };
const COOKIE = "rotala_items";

type DemoStore = Partial<Record<ItemKind, Item<unknown>[]>>;

async function readDemo(): Promise<DemoStore> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as DemoStore;
  } catch {
    return {};
  }
}

async function writeDemo(store: DemoStore) {
  (await cookies()).set(COOKIE, Buffer.from(JSON.stringify(store)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export class NotSignedInError extends Error {}

async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new NotSignedInError("Giriş gerekli");
  return user;
}

export async function listItems<T>(kind: ItemKind): Promise<Item<T>[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  if (user.mode === "demo") return ((await readDemo())[kind] ?? []) as Item<T>[];
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("user_items")
    .select("id, data, created_at")
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(LIMIT[kind]);
  if (error) {
    console.error("Kayıtlar okunamadı:", kind, error.message);
    return [];
  }
  return (data ?? []).map((r) => ({ id: r.id as string, data: r.data as T, createdAt: r.created_at as string }));
}

/** Yeni kayıt ya da (id verilirse) güncelleme. */
export async function saveItem<T>(kind: ItemKind, data: T, id?: string): Promise<Item<T>> {
  const user = await requireUser();
  if (user.mode === "demo") {
    const store = await readDemo();
    const list = (store[kind] ?? []) as Item<T>[];
    const existing = id ? list.find((x) => x.id === id) : undefined;
    const item: Item<T> = { id: existing?.id ?? randomUUID(), data, createdAt: existing?.createdAt ?? new Date().toISOString() };
    store[kind] = [item, ...list.filter((x) => x.id !== item.id)].slice(0, DEMO_MAX[kind]);
    await writeDemo(store);
    return item;
  }
  const supabase = await supabaseServer();
  const row = { user_id: user.id, kind, data, updated_at: new Date().toISOString() };
  const res = id
    ? await supabase.from("user_items").update(row).eq("id", id).eq("kind", kind).select("id, created_at").single()
    : await supabase.from("user_items").insert(row).select("id, created_at").single();
  if (res.error) throw new Error(`Kayıt yazılamadı: ${res.error.message}`);
  return { id: res.data.id as string, data, createdAt: res.data.created_at as string };
}

export async function deleteItem(kind: ItemKind, id: string): Promise<void> {
  const user = await requireUser();
  if (user.mode === "demo") {
    const store = await readDemo();
    store[kind] = (store[kind] ?? []).filter((x) => x.id !== id);
    await writeDemo(store);
    return;
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.from("user_items").delete().eq("id", id).eq("kind", kind);
  if (error) throw new Error(`Kayıt silinemedi: ${error.message}`);
}

/** Çıkışta örnek mod kayıtları da silinir (ortak bilgisayar). */
export async function clearDemoItems() {
  (await cookies()).delete(COOKIE);
}
