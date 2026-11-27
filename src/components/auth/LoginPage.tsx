"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { LoginPanel } from "./LoginPanel";
import { isAffiliate } from "@/config/affiliate";
import type { LoginState } from "@/actions/auth";

/** /giris sayfası (JavaScript'siz bağlantılar ve girişe yönlendirmeler için). */
export function LoginPageClient({ next, initialError }: { next?: string; initialError?: LoginState["error"] }) {
  const router = useRouter();
  const locale = useLocale();
  const onSignedIn = useCallback(() => {
    // Örnek modda giriş anında olur: başlıktaki işaret yenilensin diye tam sayfa geçiş.
    const target = next ?? getPathname({ href: isAffiliate() ? "/hesap" : "/biletlerim", locale: locale as "tr" });
    router.replace(target);
    router.refresh();
  }, [next, locale, router]);
  return <LoginPanel next={next} initialError={initialError} onSignedIn={onSignedIn} />;
}
