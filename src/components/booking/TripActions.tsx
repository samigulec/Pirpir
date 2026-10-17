"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "../CurrencyProvider";
import { Calendar, Download, Share } from "../icons";
import { addBagsToBooking, confirmCancel, getCancelQuote, getOrderBags, type AddBagsState, type CancelState } from "@/actions/booking";
import { BagPicker } from "./BookingForm";
import { bagsCost, NO_BAGS } from "@/lib/extras";
import type { BagChoice } from "@/lib/providers/types";

const action = "flex min-h-[56px] items-center justify-center gap-2 rounded-[18px] border-0 font-display text-lg font-semibold leading-[normal] no-underline";

/** Onay sayfasındaki eylemler: seyahat planı, takvim, paylaş. */
export function TripActions({ bookingId, shareTitle, shareText }: { bookingId: string; shareTitle: string; shareText: string }) {
  const t = useTranslations("confirm");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  // Paylaşılan metinde rezervasyon kodu yoktur (kodla rezervasyon yönetilebilir).
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText });
        return;
      } catch {
        // Kullanıcı vazgeçti ya da desteklenmiyor: panoya kopyala
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px]">
      <Link href={{ pathname: "/rezervasyon/[teklifId]/plan", params: { teklifId: bookingId } }} className={`${action} bg-primary text-white`}>
        <Download />
        {t("download")}
      </Link>
      <a href={`/api/takvim/${encodeURIComponent(bookingId)}?lang=${locale}`} download className={`${action} bg-field text-ink`}>
        <Calendar />
        {t("calendar")}
      </a>
      <button type="button" onClick={share} className={`${action} cursor-pointer bg-field text-ink`}>
        <Share />
        <span aria-live="polite">{copied ? t("copied") : t("share")}</span>
      </button>
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
