"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { requestLogin, signInWithGoogle, type LoginState } from "@/actions/auth";

const input =
  "box-border min-h-[56px] rounded-[18px] border-2 border-solid border-line bg-white px-[18px] py-[14px] text-[18px] font-semibold text-ink";
const primary =
  "flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-pill border-0 bg-primary px-6 font-display text-[19px] font-semibold leading-[normal] text-white disabled:cursor-wait disabled:opacity-80";

export function LoginForm({ next, google, initialError }: { next?: string; google: boolean; initialError?: string }) {
  const t = useTranslations("account.login");
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLogin, {
    status: initialError ? "error" : "idle",
    error: initialError as LoginState["error"],
  });

  if (state.status === "sent") {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-[28px] bg-green-soft px-6 py-5">
        <span className="font-display text-2xl font-semibold">{t("sentTitle")}</span>
        <span className="text-ink">{t.rich("sentText", { email: () => <strong>{state.email}</strong> })}</span>
        <a href="" className="self-start font-extrabold">{t("sentAgain")}</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={action} noValidate className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? ""} />
        <label className="flex flex-col gap-[6px] text-[15px] font-extrabold">
          {t("email")}
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={state.email}
            placeholder="ayse@eposta.com"
            aria-invalid={state.error === "email" || undefined}
            className={input}
          />
        </label>
        {state.status === "error" && state.error && (
          <span role="alert" className="font-bold text-coral-text">{t(`errors.${state.error}`)}</span>
        )}
        <button type="submit" disabled={pending} className={primary}>
          {pending ? t("sending") : t("submit")}
        </button>
      </form>
      {google && (
        <>
          <span className="text-center text-sm font-bold text-muted">{t("or")}</span>
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next ?? ""} />
            <button
              type="submit"
              className="flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-pill border-2 border-solid border-line bg-white px-6 font-display text-[19px] font-semibold leading-[normal] text-ink"
            >
              {t("google")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
