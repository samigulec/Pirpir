"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { removeTraveller, saveTraveller } from "@/actions/user";
import { NationalitySelect, type CountryOptions } from "../booking/NationalitySelect";
import { Lock } from "../icons";
import { nationalityName, toCountryCode } from "@/data/countries";
import { intlLocale } from "@/lib/intl";
import type { Saved, Traveller } from "@/lib/user-types";

/** Formda doğum tarihi GG.AA.YYYY yazılır (rezervasyon formundakiyle aynı); kayıtta YYYY-AA-GG. */
type Draft = Omit<Traveller, "bornOn"> & { birth: string; id?: string };

const toDraft = (t: Traveller, id?: string): Draft => {
  const [y, m, d] = t.bornOn.split("-");
  return { ...t, nationality: toCountryCode(t.nationality), birth: t.bornOn ? `${d}.${m}.${y}` : "", id };
};

/** Yazarken noktaları kendisi koyar: 29052003 → 29.05.2003 */
const maskBirth = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join(".");
};

const toIso = (birth: string) => {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(birth);
  if (!m) return "";
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(iso) ? iso : "";
};

/** Hesaptaki kayıtlı yolcular: rezervasyonda tek tıkla doldurulur. Ekle, düzenle, sil. */
export function SavedTravellers({ initial, countries, defaultNationality }: { initial: Saved<Traveller>[]; countries: CountryOptions; defaultNationality: string }) {
  const t = useTranslations("account.travellers");
  const tb = useTranslations("booking.passenger");
  const locale = useLocale();
  const loc = intlLocale(locale);
  const [list, setList] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const input =
    "box-border min-h-[52px] w-full rounded-[16px] border-2 border-solid border-line bg-field px-4 text-base font-bold text-ink focus:border-primary focus:outline-none";
  const label = "flex min-w-0 flex-col gap-[6px] text-[15px] font-extrabold";
  const button = "min-h-[44px] cursor-pointer rounded-pill border-0 px-5 font-display text-base font-semibold";
  const empty: Draft = { givenName: "", familyName: "", gender: "f", birth: "", nationality: defaultNationality };

  const save = () =>
    draft &&
    start(async () => {
      const { id, birth, ...rest } = draft;
      const r = await saveTraveller({ ...rest, bornOn: toIso(birth) }, id);
      if (!r.ok) return setError(true);
      setList((l) => [r.value, ...l.filter((x) => x.id !== r.value.id)]);
      setDraft(null);
      setError(false);
    });

  const initials = (tr: Traveller) => `${tr.givenName[0] ?? ""}${tr.familyName[0] ?? ""}`.toLocaleUpperCase(locale);

  return (
    <div className="flex flex-col gap-3">
      {list.length === 0 && !draft && <p className="m-0 text-muted">{t("empty")}</p>}
      {list.map((tr) => (
        <div key={tr.id} className="flex flex-wrap items-center gap-3 rounded-[20px] bg-field px-4 py-3">
          <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-sky font-display text-lg font-semibold text-primary">
            {initials(tr.data)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-extrabold">{tr.data.givenName} {tr.data.familyName}</span>
            <span className="text-sm font-semibold text-muted">
              {[
                new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(tr.data.bornOn + "T00:00:00Z")),
                nationalityName(tr.data.nationality, locale),
                tr.data.passport && `${t("passportShort")} ••••${tr.data.passport.slice(-3)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => { setDraft(toDraft(tr.data, tr.id)); setError(false); }} className={`${button} bg-white text-ink`}>{t("edit")}</button>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => { if ((await removeTraveller(tr.id)).ok) setList((l) => l.filter((x) => x.id !== tr.id)); })}
              className={`${button} bg-white text-coral-text`}
            >
              {t("remove")}
            </button>
          </span>
        </div>
      ))}

      {draft ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-4 rounded-[24px] border-2 border-solid border-line bg-white px-5 py-5"
        >
          <h3 className="m-0 font-display text-lg font-semibold">{draft.id ? t("editTitle") : t("newTitle")}</h3>

          <fieldset className="m-0 flex flex-col gap-[6px] border-0 p-0">
            <legend className="mb-[6px] p-0 text-[15px] font-extrabold">{t("gender")}</legend>
            <div className="flex gap-2">
              {(["f", "m"] as const).map((g) => (
                <label
                  key={g}
                  className={`flex min-h-[44px] cursor-pointer items-center rounded-pill border-2 border-solid px-5 font-display text-base font-semibold ${
                    draft.gender === g ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
                  }`}
                >
                  <input type="radio" name="gender" value={g} checked={draft.gender === g} onChange={() => setDraft({ ...draft, gender: g })} className="sr-only" />
                  {g === "f" ? tb("female") : tb("male")}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-[6px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>{t("firstName")}
                <input value={draft.givenName} onChange={(e) => setDraft({ ...draft, givenName: e.target.value })} autoComplete="given-name" className={input} required />
              </label>
              <label className={label}>{t("lastName")}
                <input value={draft.familyName} onChange={(e) => setDraft({ ...draft, familyName: e.target.value })} autoComplete="family-name" className={input} required />
              </label>
            </div>
            <span className="text-[13px] font-semibold text-muted">{t("nameHint")}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>{t("birth")}
              <input
                value={draft.birth}
                onChange={(e) => setDraft({ ...draft, birth: maskBirth(e.target.value) })}
                inputMode="numeric"
                placeholder={tb("birthPlaceholder")}
                autoComplete="bday"
                className={input}
                aria-invalid={error && !toIso(draft.birth) ? true : undefined}
              />
            </label>
            <div className={label}>
              <span id="traveller-nationality">{tb("nationality")}</span>
              <NationalitySelect labelId="traveller-nationality" options={countries} value={draft.nationality} onChange={(code) => setDraft({ ...draft, nationality: code })} className={input} />
            </div>
            <label className={label}>{t("passportOptional")}
              <input value={draft.passport ?? ""} onChange={(e) => setDraft({ ...draft, passport: e.target.value })} className={`${input} uppercase`} autoComplete="off" />
            </label>
          </div>

          <p className="m-0 flex items-start gap-2 rounded-[16px] bg-field px-4 py-3 text-sm font-semibold text-muted">
            <Lock size={18} className="mt-[1px] flex-none text-green-text" />
            {t("privacy")}
          </p>
          {error && <span role="alert" className="font-bold text-coral-text">{t("error")}</span>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className={`${button} bg-primary text-white`}>{t("save")}</button>
            <button type="button" onClick={() => { setDraft(null); setError(false); }} className={`${button} bg-field text-ink`}>{t("cancel")}</button>
          </div>
        </form>
      ) : (
        list.length < 20 && (
          <button type="button" onClick={() => setDraft(empty)} className={`${button} self-start bg-sky text-ink`}>+ {t("add")}</button>
        )
      )}
    </div>
  );
}
