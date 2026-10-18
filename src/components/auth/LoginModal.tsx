"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { SIGNED_IN_COOKIE } from "@/lib/auth/config";
import { LoginPanel } from "./LoginPanel";

type AuthUi = {
  signedIn: boolean;
  /** Giriş penceresini açar; `next`: girişten sonra gidilecek sayfa (isteğe bağlı). */
  openLogin: (next?: string) => void;
  /** Çıkış başladı: başlık sunucuyu beklemeden "Giriş yap"a döner */
  markSignedOut: () => void;
};

const Ctx = createContext<AuthUi | null>(null);

const readFlag = () => document.cookie.split("; ").some((c) => c.startsWith(SIGNED_IN_COOKIE + "="));

/** Her sayfada kullanılabilen giriş penceresi (native <dialog>: odak hapsi, Escape ile kapanma). */
export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("account.login");
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [signedIn, setSignedIn] = useState(false);
  const [next, setNext] = useState<string | undefined>();
  // Her açılışta panel sıfırlansın.
  const [session, setSession] = useState(0);

  const pathname = usePathname();
  // Çıkış/giriş sonrası yönlendirmelerde başlık güncel kalsın.
  useEffect(() => setSignedIn(readFlag()), [pathname]);

  const openLogin = useCallback((n?: string) => {
    setNext(n);
    setSession((s) => s + 1);
    ref.current?.showModal();
  }, []);

  const close = () => ref.current?.close();

  const markSignedOut = useCallback(() => {
    document.cookie = `${SIGNED_IN_COOKIE}=; path=/; max-age=0`;
    setSignedIn(false);
  }, []);

  const onSignedIn = useCallback(() => {
    setSignedIn(true);
    ref.current?.close();
    if (next) router.push(next);
    else router.refresh();
  }, [next, router]);

  return (
    <Ctx.Provider value={{ signedIn, openLogin, markSignedOut }}>
      {children}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto box-border max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[460px] overflow-y-auto rounded-[32px] border-0 bg-white p-0 text-ink shadow-search backdrop:bg-ink/50"
      >
        <div className="relative px-6 pb-7 pt-8 sm:px-9">
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            className="absolute right-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-muted hover:bg-field"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <LoginPanel key={session} next={next} onSignedIn={onSignedIn} titleId={titleId} />
        </div>
      </dialog>
    </Ctx.Provider>
  );
}

export function useAuthUi(): AuthUi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuthUi, LoginModalProvider içinde kullanılmalı");
  return ctx;
}
