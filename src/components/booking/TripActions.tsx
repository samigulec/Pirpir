"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "../CurrencyProvider";
import { PdfLink } from "../account/PdfLink";
import { Download } from "../icons";
import { ShareTrip } from "./ShareTrip";
import {
  addBagsToBooking,
  confirmCancel,
  confirmChange,
  getCancelQuote,
  getChangeOptions,
  getOrderBags,
  type AddBagsState,
  type CancelState,
  type ChangeState,
} from "@/actions/booking";
import { legKey } from "@/lib/change-options";
import { formatDayWithWeekday, minsParts } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { BagPicker } from "./BookingForm";
import { bagsCost, NO_BAGS } from "@/lib/extras";
import type { BagChoice, ChangeOption, ChangeRequest, Leg } from "@/lib/providers/types";

const action = "flex min-h-[56px] items-center justify-center gap-2 rounded-[18px] border-0 font-display text-lg font-semibold leading-[normal] no-underline";

/** Onay sayfasındaki eylemler: seyahat planı PDF'i ve paylaş. */
export function TripActions({ bookingId, share }: { bookingId: string; share: { title: string; text: string; fileName: string } }) {
  const t = useTranslations("confirm");
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px]">
        <PdfLink bookingId={bookingId} className={`${action} bg-primary text-white`}>
          <Download />
          {t("download")}
        </PdfLink>
        <ShareTrip bookingId={bookingId} {...share} className={`${action} cursor-pointer bg-field text-ink`} />
      </div>
      <Link href={{ pathname: "/rezervasyon/[teklifId]/plan", params: { teklifId: bookingId } }} className="self-center py-2 text-[15px] font-extrabold">
        {t("printView")}
      </Link>
    </div>
  );
}

/** Rezervasyonu iptal: önce iade tutarı gösterilir, onaylanınca iptal edilir. */
export function CancelBooking({ bookingId, held }: { bookingId: string; held: boolean }) {
  const t = useTranslations("confirm.manage");
  const { fmt } = useCurrency();
  const router = useRouter();
  const [state, setState] = useState<CancelState>({});
  const [pending, start] = useTransition();

  const button = "min-h-[48px] cursor-pointer rounded-pill border-0 px-6 py-3 font-display text-lg font-semibold leading-[normal] disabled:cursor-wait disabled:opacity-70";

  return (
    <section className="flex flex-col gap-3 rounded-[28px] border-2 border-solid border-line px-6 py-5">
      <h2 className="m-0 font-display text-xl font-semibold">{t("title")}</h2>
      {!state.quote ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setState(await getCancelQuote(bookingId)))}
          className={`${button} self-start bg-field text-coral-text`}
        >
          {pending ? t("checking") : t(held ? "cancelHold" : "cancel")}
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-[20px] bg-coral-soft px-5 py-4">
          <span className="font-bold">
            {held ? t("holdNote") : state.quote.refund > 0 ? t("refund", { price: fmt(state.quote.refund) }) : t("noRefund")}
          </span>
          {!held && state.quote.refund > 0 && state.quote.refundTo && (
            <span className="text-sm text-muted">{t.has(`refundTo.${state.quote.refundTo}`) ? t(`refundTo.${state.quote.refundTo}`) : ""}</span>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await confirmCancel(bookingId, state.quote!.id);
                  if (res.done) router.refresh();
                  else setState({ ...state, error: res.error });
                })
              }
              className={`${button} bg-coral text-ink`}
            >
              {pending ? t("cancelling") : t("confirm")}
            </button>
            <button type="button" disabled={pending} onClick={() => setState({})} className={`${button} bg-white text-ink`}>
              {t("back")}
            </button>
          </div>
        </div>
      )}
      {state.error && <span role="alert" className="font-bold text-coral-text">{t(`errors.${state.error}`)}</span>}
    </section>
  );
}

/** Rezervasyondan sonra bagaj ekleme (havayolunun güncel fiyatlarıyla). */
export function AddBags({ bookingId }: { bookingId: string }) {
  const t = useTranslations("confirm.addBags");
  const { fmt } = useCurrency();
  const router = useRouter();
  const [state, setState] = useState<AddBagsState>({});
  const [choices, setChoices] = useState<BagChoice[]>([]);
  const [pending, start] = useTransition();
  const button = "min-h-[48px] cursor-pointer rounded-pill border-0 px-6 py-3 font-display text-lg font-semibold leading-[normal] disabled:cursor-wait disabled:opacity-70";

  const open = () =>
    start(async () => {
      const res = await getOrderBags(bookingId);
      setState(res);
      setChoices((res.passengers ?? []).map(() => NO_BAGS));
    });
  const cost = state.bags ? bagsCost(state.bags, choices) : 0;

  if (state.done) return <p role="status" className="m-0 font-bold text-green-text">{t("added")}</p>;

  return (
    <section className="flex flex-col gap-3 rounded-[28px] border-2 border-solid border-line px-6 py-5">
      <h2 className="m-0 font-display text-xl font-semibold">{t("title")}</h2>
      {!state.bags ? (
        <button type="button" disabled={pending} onClick={open} className={`${button} self-start bg-field text-ink`}>
          {pending ? t("loading") : t("open")}
        </button>
      ) : (
        <>
          <span className="text-[15px] text-muted">{t("choose")}</span>
          {state.passengers!.map((name, i) => (
            <BagPicker
              key={i}
              title={state.passengers!.length > 1 || name ? name || t("pax", { n: i + 1 }) : undefined}
              bags={state.bags!}
              value={choices[i]}
              onChange={(patch) => setChoices((l) => l.map((c, k) => (k === i ? { ...c, ...patch } : c)))}
            />
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || cost === 0}
              onClick={() =>
                start(async () => {
                  const res = await addBagsToBooking(bookingId, choices);
                  if (res.done) {
                    setState({ done: true });
                    router.refresh();
                  } else setState({ ...state, error: res.error });
                })
              }
              className={`${button} bg-primary text-white disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {pending ? t("paying") : t("pay", { price: fmt(cost) })}
            </button>
            <button type="button" disabled={pending} onClick={() => setState({})} className={`${button} bg-white text-ink`}>
              {t("cancel")}
            </button>
          </div>
        </>
      )}
      {state.error && <span role="alert" className="font-bold text-coral-text">{t(`errors.${state.error}`)}</span>}
    </section>
  );
}

/**
 * Uçuş değişikliği (Kiwi'deki "Uçuşu değiştir"): yeni gün seçilir, havayolunun seçenekleri ve ödenecek tutar
 * (değişiklik ücreti + fiyat farkı) gösterilir, onaylanınca bilet güncellenir. Tutarlar havayolundan gelir.
 */
export function ChangeFlight({
  bookingId,
  outDate,
  inDate,
  changeable,
  changeFee,
  today,
}: {
  bookingId: string;
  outDate: string;
  inDate?: string;
  changeable?: boolean;
  changeFee?: number;
  today: string;
}) {
  const t = useTranslations("confirm.change");
  const tc = useTranslations("common");
  const loc = intlLocale(useLocale());
  const { fmt } = useCurrency();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [legs, setLegs] = useState({ out: true, in: false });
  const [dates, setDates] = useState({ out: outDate, in: inDate ?? "" });
  const [state, setState] = useState<ChangeState>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [pickedOut, setPickedOut] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const button = "min-h-[48px] cursor-pointer rounded-pill border-0 px-6 py-3 font-display text-lg font-semibold leading-[normal] disabled:cursor-not-allowed disabled:opacity-60";
  const input = "min-h-[48px] rounded-[16px] border-2 border-solid border-line bg-field px-4 font-bold text-ink";

  const req: ChangeRequest = { outDate: legs.out ? dates.out : undefined, inDate: legs.in && inDate ? dates.in : undefined };
  const option = state.options?.find((o) => o.id === picked);
  // İki bacak birden değişiyorsa önce gidiş, sonra o gidişle gelen dönüşler seçilir (her biri bir kez listelenir)
  const both = !!(state.options?.length && state.options.every((o) => o.outbound && o.inbound));
  const outGroups = both
    ? state.options!.reduce<[string, ChangeOption[]][]>((acc, o) => {
        const k = legKey(o.outbound);
        const g = acc.find(([x]) => x === k);
        if (g) g[1].push(o);
        else acc.push([k, [o]]);
        return acc;
      }, [])
    : [];
  const optionClass = (on: boolean) =>
    `flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 rounded-[20px] border-[3px] border-solid px-4 py-3 text-left text-ink ${
      on ? "border-primary bg-sky" : "border-line bg-white"
    }`;
  const flightLine = (l: Leg) => (
    <span className="flex flex-col">
      <span className="font-display text-[18px] font-semibold">
        {l.dep} {l.fromCode} → {l.arr}
        {l.arrDayOffset > 0 && <sup className="ml-[1px] text-[11px] font-extrabold text-coral-text">+{l.arrDayOffset}</sup>} {l.toCode}
      </span>
      <span className="text-[13px] font-semibold text-muted">
        {[
          formatDayWithWeekday(l.date, loc),
          l.airline,
          l.segments?.map((g) => g.flightNumber).filter(Boolean).join(", "),
          l.stops === 0 ? tc("direct") : l.stops === 1 ? tc("oneStop") : tc("stops", { n: l.stops }),
          l.mins > 0 ? tc("duration", minsParts(l.mins)) : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </span>
  );
  const optionNotes = (o: ChangeOption, best?: boolean) =>
    o.fareBrand || (o.penalty ?? 0) > 0 || best ? (
      <span className="flex flex-wrap gap-2 text-[13px] font-semibold text-muted">
        {best && <span className="rounded-pill bg-green-soft px-2 font-extrabold text-green-text">{t("cheapest")}</span>}
        {o.fareBrand && <span className="rounded-pill bg-field px-2 font-extrabold text-ink">{o.fareBrand}</span>}
        {(o.penalty ?? 0) > 0 && <span>{t("includesFee", { price: fmt(o.penalty!) })}</span>}
      </span>
    ) : null;
  const amountText = (o: ChangeOption) => (o.changeTotal > 0 ? t("pay", { price: fmt(o.changeTotal) }) : o.changeTotal < 0 ? t("refund", { price: fmt(-o.changeTotal) }) : t("free"));

  if (state.done) return <p role="status" className="m-0 font-bold text-green-text">{t("done")}</p>;

  return (
    <section className="flex flex-col gap-3 rounded-[28px] border-2 border-solid border-line px-6 py-5">
      <h2 className="m-0 font-display text-xl font-semibold">{t("title")}</h2>
      {changeable === false ? (
        <p className="m-0 text-muted">{t("notAllowed")}</p>
      ) : !open ? (
        <>
          <p className="m-0 text-[15px] text-muted">
            {changeFee === 0 ? t("feeFree") : changeFee !== undefined ? t("feeKnown", { price: fmt(changeFee) }) : t("feeUnknown")}
          </p>
          <button type="button" onClick={() => setOpen(true)} className={`${button} self-start bg-field text-ink`}>
            {t("open")}
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
            {(["out", "in"] as const)
              .filter((k) => k === "out" || inDate)
              .map((k) => (
                <div key={k} className="flex flex-col gap-2">
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-2 font-extrabold">
                    <input
                      type="checkbox"
                      checked={legs[k]}
                      onChange={(e) => {
                        setLegs({ ...legs, [k]: e.target.checked });
                        setState({});
                        setPicked(null);
                      }}
                      className="h-5 w-5 accent-primary"
                    />
                    {t(k === "out" ? "outbound" : "inbound")}
                  </label>
                  <input
                    type="date"
                    aria-label={t(k === "out" ? "outDate" : "inDate")}
                    disabled={!legs[k]}
                    min={k === "in" && legs.out ? dates.out : today}
                    value={dates[k]}
                    onChange={(e) => {
                      setDates({ ...dates, [k]: e.target.value });
                      setState({});
                      setPicked(null);
                    }}
                    className={`${input} disabled:opacity-50`}
                  />
                </div>
              ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || (!req.outDate && !req.inDate)}
              onClick={() =>
                start(async () => {
                  setPicked(null);
                  setPickedOut(null);
                  setState(await getChangeOptions(bookingId, req));
                })
              }
              className={`${button} bg-primary text-white`}
            >
              {pending && !state.options ? t("searching") : t("search")}
            </button>
            <button type="button" disabled={pending} onClick={() => { setOpen(false); setState({}); }} className={`${button} bg-white text-ink`}>
              {t("back")}
            </button>
          </div>

          {state.options && (
            <div className="flex flex-col gap-2">
              {both ? (
                <>
                  <h3 className="m-0 mt-1 text-[15px] font-extrabold">{t("stepOut")}</h3>
                  <div role="radiogroup" aria-label={t("stepOut")} className="flex flex-col gap-2">
                    {outGroups.map(([key, list]) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={pickedOut === key}
                        onClick={() => {
                          setPickedOut(key);
                          setPicked(list.length === 1 ? list[0].id : null);
                        }}
                        className={optionClass(pickedOut === key)}
                      >
                        {flightLine(list[0].outbound!)}
                        <span className="font-display text-[17px] font-semibold">{t("fromAmount", { amount: amountText(list[0]) })}</span>
                      </button>
                    ))}
                  </div>
                  {pickedOut && (
                    <>
                      <h3 className="m-0 mt-2 text-[15px] font-extrabold">{t("stepIn")}</h3>
                      <div role="radiogroup" aria-label={t("stepIn")} className="flex flex-col gap-2">
                        {(outGroups.find(([k]) => k === pickedOut)?.[1] ?? []).map((o) => (
                          <button key={o.id} type="button" role="radio" aria-checked={picked === o.id} onClick={() => setPicked(o.id)} className={optionClass(picked === o.id)}>
                            <span className="flex flex-col gap-1">
                              {o.inbound && flightLine(o.inbound)}
                              {optionNotes(o)}
                            </span>
                            <span className="font-display text-lg font-semibold">{amountText(o)}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div role="radiogroup" aria-label={t("options")} className="flex flex-col gap-2">
                  {state.options.map((o, i) => (
                    <button key={o.id} type="button" role="radio" aria-checked={picked === o.id} onClick={() => setPicked(o.id)} className={optionClass(picked === o.id)}>
                      <span className="flex flex-col gap-1">
                        {(o.outbound ?? o.inbound) && flightLine((o.outbound ?? o.inbound)!)}
                        {optionNotes(o, i === 0 && state.options!.length > 1)}
                      </span>
                      <span className="font-display text-lg font-semibold">{amountText(o)}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="m-0 text-[13px] font-semibold text-muted">{t("note")}</p>
              <button
                type="button"
                disabled={!option || pending}
                onClick={() =>
                  option &&
                  start(async () => {
                    const res = await confirmChange(bookingId, req, option.id, option.changeTotal);
                    if (res.done) {
                      setState(res);
                      router.refresh();
                    } else setState({ ...state, error: res.error, newTotal: res.newTotal });
                  })
                }
                className={`${button} self-start bg-primary text-white`}
              >
                {pending ? t("confirming") : option ? t("confirm", { amount: amountText(option) }) : t("pick")}
              </button>
            </div>
          )}
        </>
      )}
      {state.error && (
        <span role="alert" className="font-bold text-coral-text">
          {state.error === "priceChanged" && state.newTotal !== undefined ? t("errors.priceChanged", { price: fmt(state.newTotal) }) : t(`errors.${state.error}`)}
        </span>
      )}
    </section>
  );
}
