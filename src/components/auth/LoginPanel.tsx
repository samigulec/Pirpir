"use client";

import { useActionState, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { requestLogin, signInWithProvider, type LoginState, type OAuthProvider } from "@/actions/auth";
import { LogoMark } from "../Logo";
import { brand } from "@/config/brand";
import { ProviderLogo } from "./ProviderLogo";

const PROVIDERS: OAuthProvider[] = ["google", "facebook", "apple"];

const social =
  "flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[18px] border-0 bg-field px-5 font-display text-lg font-semibold leading-[normal] text-ink hover:bg-line disabled:cursor-wait disabled:opacity-70";

/**
 * Giriş içeriği: hem açılır pencerede hem /giris sayfasında kullanılır.
 * Sosyal butonlarda sağlayıcıların marka işaretleri var (assets/brands/README.md).
 */
export function LoginPanel({
  next,
  initialError,
  onSignedIn,
  titleId,
}: {
  next?: string;
  initialError?: LoginState["error"];
  onSignedIn: () => void;
  titleId?: string;
}) {
  const t = useTranslations("account.login");
  const [email, emailAction, emailPending] = useActionState<LoginState, FormData>(requestLogin, {
    status: initialError ? "error" : "idle",
    error: initialError,
  });
  const [oauth, oauthAction, oauthPending] = useActionState<LoginState, FormData>(signInWithProvider, { status: "idle" });
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if (email.status === "signedIn") onSignedIn();
  }, [email.status, onSignedIn]);

  if (email.status === "sent") {
    return (
      <div role="status" className="flex flex-col items-center gap-3 text-center">
        <LogoMark size={48} />
        <h2 id={titleId} className="m-0 font-display text-[28px] font-bold leading-[1.15]">{t("sentTitle")}</h2>
        <p className="m-0 text-ink">{t.rich("sentText", { email: () => <strong>{email.email}</strong> })}</p>
        <a href="" className="font-extrabold">{t("sentAgain")}</a>
      </div>
    );
  }

  const error = email.status === "error" ? email.error : oauth.status === "error" ? oauth.error : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex items-center gap-2">
          <LogoMark size={40} />
          <span className="font-display text-[28px] font-bold">{brand.name}</span>
        </span>
        <h2 id={titleId} className="m-0 mt-2 font-display text-[28px] font-bold leading-[1.15]">{t("title")}</h2>
        <p className="m-0 text-[15px] text-muted">{t("newHere")}</p>
      </div>

      <form action={oauthAction} className="flex flex-col gap-[10px]">
        <input type="hidden" name="next" value={next ?? ""} />
        {PROVIDERS.map((p) => (
          <button key={p} type="submit" name="provider" value={p} disabled={oauthPending} className={social}>
            <ProviderLogo provider={p} />
            {t(`providers.${p}`)}
          </button>
        ))}
      </form>

      <div className="flex items-center gap-3 text-sm font-bold text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        {t("or")}
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={emailAction} noValidate className="flex flex-col gap-[10px]">
        <input type="hidden" name="next" value={next ?? ""} />
        <label className="flex flex-col">
          <span className="sr-only">{t("email")}</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={email.email}
            placeholder={t("emailPlaceholder")}
            aria-invalid={email.error === "email" || undefined}
            className="box-border min-h-[56px] rounded-[18px] border-2 border-solid border-line bg-white px-[18px] py-[14px] text-[18px] font-semibold text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={emailPending}
          className="flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-[18px] border-0 bg-primary px-6 font-display text-[19px] font-semibold leading-[normal] text-white disabled:cursor-wait disabled:opacity-80"
        >
          {emailPending ? t("sending") : t("continue")}
        </button>
      </form>

      {error && (
        <p role="alert" className="m-0 rounded-[16px] bg-coral-soft px-4 py-3 text-[15px] font-bold text-ink">
          {t(`errors.${error}`)}
        </p>
      )}

      <div className="flex flex-col items-center gap-2 text-center">
        <button type="button" onClick={() => setHelp(!help)} aria-expanded={help} className="cursor-pointer border-0 bg-transparent p-1 font-extrabold text-ink underline">
          {t("wrongEmail")}
        </button>
        {help && <p className="m-0 text-[15px] text-muted">{t("wrongEmailHelp")}</p>}
        <p className="m-0 text-sm text-muted">
          {t.rich("legal", {
            terms: (c) => <Link href="/kosullar" target="_blank" className="font-bold text-ink">{c}</Link>,
            privacy: (c) => <Link href="/gizlilik" target="_blank" className="font-bold text-ink">{c}</Link>,
          })}
        </p>
      </div>
    </div>
  );
}
