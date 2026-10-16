"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SIGNED_IN_COOKIE } from "@/lib/auth/config";
import { User } from "./icons";

const pill =
  "box-border inline-flex min-h-[44px] items-center whitespace-nowrap rounded-pill bg-sky px-5 py-[10px] font-extrabold text-ink no-underline";

/** Sayfalar statik kalsın diye giriş durumu tarayıcıda, işaret çerezinden okunur. */
function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    setSignedIn(document.cookie.split("; ").some((c) => c.startsWith(SIGNED_IN_COOKIE + "=")));
  }, []);
  return signedIn;
}

/** "Giriş yap" ya da girişliyse "Hesabım" hap butonu. */
export function AccountPill() {
  const t = useTranslations("common");
  const signedIn = useSignedIn();
  return signedIn ? (
    <Link href="/hesap" className={pill}>{t("account")}</Link>
  ) : (
    <Link href="/giris" className={pill}>{t("signIn")}</Link>
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
  const signedIn = useSignedIn();
  return (
    <Link
      href={signedIn ? "/hesap" : "/giris"}
      aria-label={signedIn ? t("account") : t("signIn")}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-sky text-ink"
    >
      <User />
    </Link>
  );
}
