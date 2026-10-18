// Duffel istek sınırı (dakikada belirli sayıda istek, anahtar başına). Ziyaretçinin kendi araması önceliklidir:
// ana sayfa fırsatları ve tarih şeridi gibi arka plan aramaları sınır daralınca ya da 429 alındıktan sonra
// hiç gönderilmez, böylece "Bilet bul" isteği sıraya takılmaz. Durum sunucu örneği başına tutulur;
// Duffel'ın her yanıtta gönderdiği ratelimit-* başlıklarından güncellenir.
import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

const background = new AsyncLocalStorage<boolean>();

/** `fn` içindeki tüm Duffel istekleri arka plan önceliğinde gider. */
export const inBackground = <T>(fn: () => Promise<T>): Promise<T> => background.run(true, fn);
export const isBackground = () => background.getStore() === true;

/** Arka plan isteği sınırı korumak için gönderilmedi (sağlayıcıya hiç gitmedi). */
export class SkippedError extends Error {
  readonly status = 429;
  readonly skipped = true;
  constructor() {
    super("Arka plan araması istek sınırı için ertelendi");
  }
}
export const isSkipped = (e: unknown) => (e as { skipped?: boolean } | null)?.skipped === true;

const state = { limit: 0, remaining: Infinity, resetAt: 0, cooldownUntil: 0 };

/** "ratelimit-reset": saniye, Unix zamanı ya da tarih olabilir → mutlak zaman (ms). */
function parseReset(h: string | null, now: number): number {
  if (!h) return now + 2000;
  const n = Number(h);
  if (Number.isFinite(n)) return n > 1e9 ? n * 1000 : now + n * 1000;
  const d = Date.parse(h);
  return Number.isNaN(d) ? now + 2000 : d;
}

export function noteResponse(res: Response) {
  const now = Date.now();
  const limit = Number(res.headers.get("ratelimit-limit"));
  const remaining = Number(res.headers.get("ratelimit-remaining"));
  if (Number.isFinite(limit) && limit > 0) state.limit = limit;
  if (res.headers.has("ratelimit-remaining") && Number.isFinite(remaining)) {
    state.remaining = remaining;
    state.resetAt = parseReset(res.headers.get("ratelimit-reset"), now);
  }
  if (res.status === 429) {
    state.remaining = 0;
    state.resetAt = parseReset(res.headers.get("ratelimit-reset"), now);
    // Sıfırlanana kadar arka plan istekleri durur (en az 3, en çok 60 sn)
    state.cooldownUntil = Math.min(now + 60_000, Math.max(now + 3000, state.resetAt));
  }
}

/** Ziyaretçi istekleri için ayrılan pay: kalan bunun altına inince arka plan istekleri gönderilmez. */
const reserve = () => Math.max(8, Math.ceil(state.limit * 0.4));

let running = 0;
const queue: (() => void)[] = [];
/** Aynı anda en fazla bu kadar arka plan isteği; pay bolken 4, değilse 2 (fırsat kartları daha çabuk dolsun). */
const backgroundSlots = () => (state.limit && state.remaining !== Infinity && state.remaining > 2 * reserve() ? 4 : 2);

/**
 * İstekten önce çağrılır. Arka planda: sınır darsa SkippedError, değilse aynı anda en fazla 2–4 istek.
 * Ziyaretçi isteğinde: 429 sonrası bekleme süresi dolana kadar bekler (en çok 8 sn). Dönen fonksiyon istek
 * bitince çağrılır.
 */
export async function acquire(): Promise<() => void> {
  const now = Date.now();
  if (!isBackground()) {
    const wait = Math.min(8000, state.cooldownUntil - now);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return () => {};
  }
  const tight = state.resetAt > now && state.remaining < reserve();
  if (state.cooldownUntil > now || tight) throw new SkippedError();
  if (running >= backgroundSlots()) await new Promise<void>((r) => queue.push(r));
  // Sırada beklerken sınır daralmış olabilir
  if (state.cooldownUntil > Date.now() || (state.resetAt > Date.now() && state.remaining < reserve())) {
    queue.shift()?.();
    throw new SkippedError();
  }
  running++;
  return () => {
    running--;
    queue.shift()?.();
  };
}

/** 429 sonrası ziyaretçi isteğinin yeniden denemeden önce bekleyeceği süre (ms). */
export const retryWait = () => Math.min(8000, Math.max(800, state.resetAt - Date.now()));

/** Ertelenen arka plan isteğinin ne zaman yeniden denenebileceği (ms, küçük rastgele kaydırmayla). */
export const backgroundRetryIn = () =>
  Math.min(30_000, Math.max(1500, Math.max(state.cooldownUntil, state.resetAt) - Date.now() + 300 + Math.random() * 700));
