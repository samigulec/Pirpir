"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthUi } from "./auth/LoginModal";
import { User } from "./icons";

const pill =
  "box-border inline-flex min-h-[44px] items-center whitespace-nowrap rounded-pill bg-sky px-5 py-[10px] font-extrabold text-ink no-underline";

/**
 * "Giriş yap" ya da girişliyse "Hesabım". Giriş, sayfa değişmeden açılır pencerede yapılır;
 * JavaScript yoksa bağlantı /giris sayfasına gider.
 */
export function AccountPill() {
  const t = useTranslations("common");
  const { signedIn, openLogin } = useAuthUi();
  return signedIn ? (
    <Link href="/hesap" className={pill}>{t("account")}</Link>
  ) : (
    <Link
      href="/giris"
      onClick={(e) => {
        e.preventDefault();
        openLogin();
      }}
      className={pill}
    >
      {t("signIn")}
    </Link>
  );
}

export function TicketsLink({ variant = "text" }: { variant?: "text" | "pill" }) {
  const t = useTranslations("common");
  return (
    <Link
      href="/biletlerim"
      className={
        variant === "pill"
          ? pill
          : "box-border inline-flex min-h-[44px] items-center px-[14px] py-[10px] font-bold text-ink no-underline"
      }
    >
      {t("myTickets")}
    </Link>
  );
}

/** Telefon başlığındaki yuvarlak profil butonu. */
export function ProfileButton() {
  const t = useTranslations("common");
  const { signedIn, openLogin } = useAuthUi();
  return (
    <Link
      href={signedIn ? "/hesap" : "/giris"}
      onClick={(e) => {
        if (signedIn) return;
        e.preventDefault();
        openLogin();
      }}
      aria-label={signedIn ? t("account") : t("signIn")}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-sky text-ink"
    >
      <User />
    </Link>
  );
}

/** Sayfa içinde giriş penceresini açan buton (ör. Biletlerim). */
export function LoginButton({ className, children }: { className: string; children: React.ReactNode }) {
  const { openLogin } = useAuthUi();
  return (
    <button type="button" onClick={() => openLogin()} className={`cursor-pointer border-0 ${className}`}>
      {children}
    </button>
  );
}
