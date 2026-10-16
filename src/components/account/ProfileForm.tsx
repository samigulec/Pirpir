"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile, type ProfileState } from "@/actions/auth";

export function ProfileForm({ name, email }: { name?: string; email: string }) {
  const t = useTranslations("account.account");
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, { status: "idle" });
  const input =
    "box-border min-h-[56px] rounded-[18px] border-2 border-solid border-line bg-white px-[18px] py-[14px] text-[18px] font-semibold text-ink";
  return (
    <form action={action} className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] items-end gap-3">
      <label className="flex flex-col gap-[6px] text-[15px] font-extrabold">
        {t("name")}
        <input type="text" name="name" defaultValue={name} placeholder={t("namePlaceholder")} autoComplete="name" className={input} />
      </label>
      <label className="flex flex-col gap-[6px] text-[15px] font-extrabold">
        {t("email")}
        <input type="email" value={email} readOnly className={`${input} bg-field text-muted`} />
      </label>
      <div className="col-span-full flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-[48px] cursor-pointer rounded-pill border-0 bg-ink px-6 py-3 font-display text-[17px] font-semibold leading-[normal] text-white disabled:opacity-70"
        >
          {t("save")}
        </button>
        {state.status === "saved" && <span role="status" className="font-extrabold text-green-text">{t("saved")}</span>}
        {state.status === "error" && <span role="alert" className="font-extrabold text-coral-text">{t("saveError")}</span>}
      </div>
    </form>
  );
}
