"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { removeTraveller, saveTraveller } from "@/actions/user";
import { nationalities } from "@/data/mock/booking";
import { intlLocale } from "@/lib/intl";
import type { Saved, Traveller } from "@/lib/user-types";

const EMPTY: Traveller = { givenName: "", familyName: "", gender: "f", bornOn: "", nationality: nationalities[0] };

/** Hesaptaki kayıtlı yolcular: rezervasyonda tek tıkla doldurulur. Ekle, düzenle, sil. */
export function SavedTravellers({ initial }: { initial: Saved<Traveller>[] }) {
  const t = useTranslations("account.travellers");
  const tb = useTranslations("booking.passenger");
  const loc = intlLocale(useLocale());
  const [list, setList] = useState(initial);
  const [draft, setDraft] = useState<(Traveller & { id?: string }) | null>(null);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const input = "min-h-[48px] rounded-[16px] border-2 border-solid border-line bg-field px-4 text-base font-bold text-ink";
  const label = "flex flex-col gap-[6px] text-[15px] font-extrabold";
  const button = "min-h-[44px] cursor-pointer rounded-pill border-0 px-5 font-display text-base font-semibold";

  const save = () =>
    draft &&
    start(async () => {
      const { id, ...data } = draft;
      const r = await saveTraveller(data, id);
      if (!r.ok) return setError(true);
      setList((l) => [r.value, ...l.filter((x) => x.id !== r.value.id)]);
      setDraft(null);
      setError(false);
    });

  return (
    <div className="flex flex-col gap-3">
      {list.length === 0 && !draft && <p className="m-0 text-muted">{t("empty")}</p>}
      {list.map((tr) => (
        <div key={tr.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-field px-5 py-3">
          <span className="flex flex-col">
            <span className="font-extrabold">{tr.data.givenName} {tr.data.familyName}</span>
            <span className="text-sm font-semibold text-muted">
              {new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(tr.data.bornOn + "T00:00:00Z"))} · {tr.data.nationality}
              {tr.data.passport && ` · ${t("passportShort")} ••••${tr.data.passport.slice(-3)}`}
            </span>
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => setDraft({ ...tr.data, id: tr.id })} className={`${button} bg-white text-ink`}>{t("edit")}</button>
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
        <div className="flex flex-col gap-3 rounded-[20px] border-2 border-solid border-line px-5 py-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            <label className={label}>{tb("firstName")}
              <input value={draft.givenName} onChange={(e) => setDraft({ ...draft, givenName: e.target.value })} autoComplete="given-name" className={input} />
            </label>
            <label className={label}>{tb("lastName")}
              <input value={draft.familyName} onChange={(e) => setDraft({ ...draft, familyName: e.target.value })} autoComplete="family-name" className={input} />
            </label>
            <label className={label}>{tb("gender")}
              <select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value === "m" ? "m" : "f" })} className={input}>
                <option value="f">{tb("female")}</option>
                <option value="m">{tb("male")}</option>
              </select>
            </label>
            <label className={label}>{tb("birth")}
              <input type="date" value={draft.bornOn} onChange={(e) => setDraft({ ...draft, bornOn: e.target.value })} className={input} />
            </label>
            <label className={label}>{tb("nationality")}
              <select value={draft.nationality} onChange={(e) => setDraft({ ...draft, nationality: e.target.value })} className={input}>
                {nationalities.map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <label className={label}>{tb("passport")}
              <input value={draft.passport ?? ""} onChange={(e) => setDraft({ ...draft, passport: e.target.value })} className={`${input} uppercase`} autoComplete="off" />
            </label>
          </div>
          <span className="text-sm text-muted">{t("privacy")}</span>
          {error && <span role="alert" className="font-bold text-coral-text">{t("error")}</span>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending} onClick={save} className={`${button} bg-primary text-white`}>{t("save")}</button>
            <button type="button" onClick={() => { setDraft(null); setError(false); }} className={`${button} bg-field text-ink`}>{t("cancel")}</button>
          </div>
        </div>
      ) : (
        list.length < 20 && (
          <button type="button" onClick={() => setDraft(EMPTY)} className={`${button} self-start bg-sky text-ink`}>+ {t("add")}</button>
        )
      )}
    </div>
  );
}
