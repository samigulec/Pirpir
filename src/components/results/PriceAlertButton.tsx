"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthUi } from "../auth/LoginModal";
import { createAlert } from "@/actions/user";
import type { MultiQuery } from "@/lib/search";

/**
 * "Fiyat alarmı kur" (Kiwi'deki gibi): bu arama hesaba kaydedilir; Fiyat alarmlarım'da kurulduğu andaki ve
 * bilinen güncel fiyat yan yana görünür. E-posta bildirimi e-posta servisi bağlanınca gelecek (metinde yazıyor).
 */
export function PriceAlertButton({ q }: { q: MultiQuery }) {
  const t = useTranslations("results.alert");
  const { signedIn, openLogin } = useAuthUi();
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  if (done)
    return (
      <span role="status" className="inline-flex min-h-[44px] flex-wrap items-center gap-2 rounded-pill bg-green-soft px-5 text-[15px] font-bold text-green-text">
        ✓ {t("done")}
        <Link href={{ pathname: "/hesap", hash: "alarmlar" }} className="font-extrabold text-green-text">{t("see")}</Link>
      </span>
    );

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!signedIn) return openLogin();
          start(async () => {
            const r = await createAlert(q);
            if (r.ok) setDone(true);
            else if (r.error === "signIn") openLogin();
            else setError(true);
          });
        }}
        className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-pill border-2 border-solid border-line bg-white px-5 font-display text-base font-semibold text-ink disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0" />
        </svg>
        {t("create")}
      </button>
      {error && <span role="alert" className="self-center text-sm font-bold text-coral-text">{t("error")}</span>}
    </>
  );
}
