"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthUi } from "./auth/LoginModal";
import { signOut } from "@/actions/auth";
import { Help, Ticket, User } from "./icons";

/**
 * Başlıktaki profil düğmesi ve açılan menü (Booking/Kiwi'deki gibi tek giriş noktası): giriş, biletler,
 * hesap ve yardım burada. Masaüstünde sağa hizalı açılır kutu, telefonda alttan açılan sayfa.
 */
export function ProfileMenu() {
  const t = useTranslations("common.menu");
  const { signedIn, openLogin } = useAuthUi();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const base = "flex min-h-[52px] w-full cursor-pointer items-center gap-3 rounded-[16px] border-0 bg-transparent px-3 text-left no-underline hover:bg-field";
  const item = `${base} text-ink`;
  const icon = "flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sky text-primary";
  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={signedIn ? t("profile") : t("signIn")}
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-pill border-0 bg-sky py-[6px] pl-[6px] pr-3 font-extrabold text-ink md:pr-4"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary"><User /></span>
        <span className="hidden md:inline">{signedIn ? t("profile") : t("signIn")}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-40 bg-ink/40 md:hidden" onClick={close} />
          <div
            id={id}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-1 rounded-t-[28px] bg-white p-4 pb-8 text-ink shadow-search md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+8px)] md:w-[320px] md:rounded-[24px] md:p-3"
          >
            {signedIn ? (
              <div className="px-3 pb-2 pt-1">
                <span className="font-display text-lg font-semibold">{t("hello")}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
                <span className="text-[15px] font-semibold text-muted">{t("signInText")}</span>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openLogin();
                  }}
                  className="min-h-[48px] cursor-pointer rounded-pill border-0 bg-primary font-display text-lg font-semibold text-white"
                >
                  {t("signIn")}
                </button>
              </div>
            )}
            <nav aria-label={t("label")} className="flex flex-col gap-1">
              <Link href="/biletlerim" onClick={close} className={item}>
                <span className={icon}><Ticket /></span>
                <span className="flex flex-col">
                  <span className="font-extrabold">{t("trips")}</span>
                  <span className="text-[13px] font-semibold text-muted">{t("tripsText")}</span>
                </span>
              </Link>
              {signedIn && (
                <Link href="/hesap" onClick={close} className={item}>
                  <span className={icon}><User /></span>
                  <span className="flex flex-col">
                    <span className="font-extrabold">{t("account")}</span>
                    <span className="text-[13px] font-semibold text-muted">{t("accountText")}</span>
                  </span>
                </Link>
              )}
              <Link href={{ pathname: "/", hash: "sss" }} onClick={close} className={item}>
                <span className={icon}><Help /></span>
                <span className="font-extrabold">{t("help")}</span>
              </Link>
            </nav>
            {signedIn && (
              <form action={signOut} className="mt-1 border-0 border-t border-solid border-line pt-2">
                <button type="submit" className={`${base} font-extrabold text-coral-text`}>
                  {t("signOut")}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
