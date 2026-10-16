"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { Valiz } from "../characters";
import { Lock } from "../icons";
import { BankaIdealIcon, CuzdanGooglePayIcon, KartIcon, TelefonApplePayIcon } from "../payment";
import {
  DEMO_PROMO_DISCOUNT,
  bagOptions,
  idealBanks,
  nationalities,
  paymentMethods,
  phoneCodes,
  type BagId,
  type PaymentId,
} from "@/data/mock/booking";
import { detectCardBrand, formatCardNumber } from "@/lib/card";

const label = "flex flex-col gap-[6px] text-[15px] font-extrabold";
const field = "box-border min-h-[56px] rounded-[18px] border-2 border-solid border-line bg-white py-[14px] text-[18px] text-ink";
const input = `${field} px-[18px] font-semibold`;
const h2 = "m-0 font-display text-2xl font-semibold";

const PAY_ICON: Record<PaymentId, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  card: KartIcon,
  ideal: BankaIdealIcon,
  apple: TelefonApplePayIcon,
  google: CuzdanGooglePayIcon,
};

export function BookingForm({
  ticketPrice,
  confirmHref,
  transferPlace,
}: {
  ticketPrice: number;
  confirmHref: string;
  /** Aktarmalı gidişte aktarma yeri ("İstanbul'da"); direkt uçuşta yok. */
  transferPlace?: string;
}) {
  const t = useTranslations("booking");
  const { fmt } = useCurrency();
  const [bag, setBag] = useState<BagId>("small");
  const [pay, setPay] = useState<PaymentId>("card");
  const [card, setCard] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState(false);
  const [terms, setTerms] = useState(false);

  const bagPrice = bagOptions.find((b) => b.id === bag)!.price;
  const discount = promo ? DEMO_PROMO_DISCOUNT : 0;
  const total = ticketPrice + bagPrice - discount;
  const brand = detectCardBrand(card);
  const payLabel = `${t(`payment.methods.${pay}.pay`)} · ${fmt(total)}`;

  return (
    <>
      {/* Yolcu */}
      <section className="flex flex-col gap-3">
        <h2 className={h2}>{t("passenger.title")}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <label className={label}>
            {t("passenger.firstName")}
            <input type="text" placeholder="Ayşe" autoComplete="given-name" className={input} />
          </label>
          <label className={label}>
            {t("passenger.lastName")}
            <input type="text" placeholder="Yılmaz" autoComplete="family-name" className={input} />
          </label>
          <label className={label}>
            {t("passenger.gender")}
            <select className={input}>
              <option>{t("passenger.female")}</option>
              <option>{t("passenger.male")}</option>
            </select>
          </label>
          <label className={label}>
            {t("passenger.birth")}
            <input type="text" placeholder={t("passenger.birthPlaceholder")} autoComplete="bday" className={input} />
          </label>
          <label className={label}>
            {t("passenger.nationality")}
            <select className={input}>
              {nationalities.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            {t("passenger.passport")}
            <input type="text" placeholder="U12345678" className={input} />
          </label>
        </div>
        <span className="text-sm text-muted">{t("passenger.note")}</span>
      </section>

      {/* İletişim */}
      <section className="flex flex-col gap-3">
        <h2 className={h2}>{t("contact.title")}</h2>
        <label className={label}>
          {t("contact.email")}
          <input type="email" placeholder="ayse@eposta.com" autoComplete="email" className={input} />
        </label>
        <div className="flex flex-col gap-[6px]">
          <span id="tel-label" className="text-[15px] font-extrabold">{t("contact.phone")}</span>
          <div className="flex gap-2">
            <select aria-label={t("contact.phoneCode")} className={`${field} px-3 font-bold`}>
              {phoneCodes.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input type="tel" aria-labelledby="tel-label" placeholder="6 1234 5678" autoComplete="tel-national" className={`${input} min-w-0 flex-1`} />
          </div>
        </div>
      </section>

      {/* Bagaj */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-[14px]">
          <Valiz stripe={false} highlights={false} tag={false} width={44} height={55} className="flex-none" />
          <div className="flex flex-col">
            <h2 className={h2}>{t("bags.title")}</h2>
            <span className="text-[15px] text-muted">{t("bags.valiz")}</span>
          </div>
        </div>
        <div role="radiogroup" aria-label={t("bags.label")} className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[10px]">
          {bagOptions.map((b) => {
            const on = bag === b.id;
            return (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setBag(b.id)}
                className={`flex min-h-[120px] cursor-pointer flex-col items-start rounded-[22px] border-[3px] border-solid px-5 py-[18px] text-left text-ink ${
                  on ? "border-coral bg-coral-soft" : "border-line bg-white"
                }`}
              >
                <span className="font-display text-[19px] font-semibold">{t(`bags.options.${b.id}.title`)}</span>
                <span className="text-sm font-semibold">{t(`bags.options.${b.id}.desc`)}</span>
                <span className="mt-[6px] font-extrabold">{b.price === 0 ? t("bags.free") : `+ ${fmt(b.price)}`}</span>
              </button>
            );
          })}
        </div>
        {transferPlace && <span className="text-sm text-muted">{t("bags.transferNote", { place: transferPlace })}</span>}
      </section>

      {/* Ödeme */}
      <section className="flex flex-col gap-[14px]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={h2}>{t("payment.title")}</h2>
          <span className="flex items-center gap-[6px] text-sm font-extrabold text-green-text">
            <Lock size={16} strokeWidth={2.6} />
            {t("payment.secure")}
          </span>
        </div>
        <div role="radiogroup" aria-label={t("payment.label")} className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[10px]">
          {paymentMethods.map((p) => {
            const on = pay === p;
            const Icon = PAY_ICON[p];
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPay(p)}
                className={`flex min-h-[120px] cursor-pointer flex-col items-start gap-[6px] rounded-[20px] border-[3px] border-solid px-4 py-[14px] text-left text-ink ${
                  on ? "border-primary bg-sky" : "border-line bg-white"
                }`}
              >
                <span className="inline-flex h-[46px] w-16 items-center justify-center rounded-[14px] bg-white">
                  <Icon width={56} height={40} />
                </span>
                <span className="font-display text-lg font-semibold">{t(`payment.methods.${p}.label`)}</span>
                <span className="text-[13px] font-bold text-muted">{t(`payment.methods.${p}.sub`)}</span>
              </button>
            );
          })}
        </div>

        {pay === "card" ? (
          // Kart bilgisi hiçbir yere gönderilmez; gerçek ödemede sağlayıcının güvenli bileşeni kullanılacak.
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 rounded-[24px] border-2 border-solid border-line p-[18px]">
            <label className={`${label} col-span-full`}>
              {t("payment.cardName")}
              <input type="text" placeholder={t("payment.cardNamePlaceholder")} autoComplete="cc-name" className={`${input} uppercase`} />
            </label>
            <label className={`${label} col-span-full`}>
              {t("payment.cardNumber")}
              <span className="relative flex">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  value={card}
                  onChange={(e) => setCard(formatCardNumber(e.target.value))}
                  className={`${field} min-w-0 flex-1 pl-[18px] pr-[120px] font-bold tracking-[0.06em]`}
                />
                <span
                  aria-live="polite"
                  className={`absolute right-[10px] top-1/2 box-border inline-flex h-[34px] min-w-[96px] -translate-y-1/2 items-center justify-center rounded-[10px] px-[10px] text-[12px] font-extrabold ${
                    brand
                      ? "border-[1.5px] border-solid border-primary bg-sky text-ink"
                      : "border-[1.5px] border-dashed border-[#B9C4DA] bg-field text-muted"
                  }`}
                >
                  {brand ? `${brand} ✓` : t("payment.cardType")}
                </span>
              </span>
            </label>
            <label className={label}>
              {t("payment.expiry")}
              <input type="text" inputMode="numeric" autoComplete="cc-exp" placeholder={t("payment.expiryPlaceholder")} className={input} />
            </label>
            <label className={label}>
              {t("payment.cvc")}
              <input type="text" inputMode="numeric" autoComplete="cc-csc" placeholder="123" className={input} />
            </label>
            <label className="col-span-full flex cursor-pointer items-center gap-[10px] text-[15px] font-bold">
              <input type="checkbox" className="m-[3px_3px_3px_4px] h-5 w-5 accent-primary" />
              {t("payment.saveCard")}
            </label>
            <span className="col-span-full text-sm text-muted">{t("payment.threeDs")}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px] rounded-[20px] bg-field px-[18px] py-4">
            <span className="font-bold text-ink">{t(`payment.methods.${pay}.note`)}</span>
            {pay === "ideal" && (
              <label className={label}>
                {t("payment.bank")}
                <select className={input}>
                  {idealBanks.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </section>

      {/* İndirim kodu */}
      <details className="rounded-[22px] bg-field px-5 py-4">
        <summary className="flex justify-between gap-3 font-extrabold">
          {t("promo.question")} <span aria-hidden="true">+</span>
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            aria-label={t("promo.label")}
            placeholder={t("promo.placeholder")}
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && promoCode.trim() && setPromo(true)}
            className="box-border min-h-[52px] flex-[1_1_200px] rounded-[16px] border-2 border-solid border-line bg-white px-4 py-3 font-bold uppercase text-ink"
          />
          <button
            type="button"
            onClick={() => promoCode.trim() && setPromo(true)}
            className="min-h-[52px] cursor-pointer rounded-[16px] border-0 bg-ink px-[22px] py-3 font-display text-[17px] font-semibold leading-[normal] text-white"
          >
            {t("promo.apply")}
          </button>
        </div>
        {promo && (
          <span role="status" className="mt-[10px] block font-extrabold text-green-text">
            {t("promo.applied", { amount: fmt(DEMO_PROMO_DISCOUNT) })}
          </span>
        )}
      </details>

      {/* Toplam */}
      <div className="flex flex-col gap-4 rounded-[28px] bg-ink px-6 py-[22px] text-white">
        <div className="flex flex-col gap-[6px] border-0 border-b border-solid border-ink-soft pb-[14px] font-bold">
          <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.ticket")}</span><span>{fmt(ticketPrice)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.bag")}</span><span>{bagPrice === 0 ? t("bags.free") : fmt(bagPrice)}</span></div>
          {promo && (
            <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.promo")}</span><span className="text-green-light">− {fmt(DEMO_PROMO_DISCOUNT)}</span></div>
          )}
          <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.taxes")}</span><span>{t("total.included")}</span></div>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-on-ink">{t("total.total")}</span>
          <span aria-live="polite" className="font-display text-[38px] font-bold leading-[1.1]">{fmt(total)}</span>
        </div>
        <label className="flex cursor-pointer items-start gap-[10px] text-[15px] font-semibold">
          <input type="checkbox" checked={terms} onChange={() => setTerms(!terms)} className="m-0 mt-[1px] h-[22px] w-[22px] flex-none accent-sun" />
          <span>
            {t.rich("total.terms", {
              terms: (c) => <a href="#" className="text-sun">{c}</a>,
              privacy: (c) => <a href="#" className="text-sun">{c}</a>,
            })}
          </span>
        </label>
        {terms ? (
          <Link
            href={confirmHref}
            className="box-border flex min-h-[60px] items-center justify-center rounded-pill bg-sun px-8 py-[14px] font-display text-[21px] font-semibold text-ink no-underline"
          >
            {payLabel}
          </Link>
        ) : (
          <>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="min-h-[60px] cursor-not-allowed rounded-pill border-0 bg-ink-soft px-8 py-[14px] font-display text-[21px] font-semibold leading-[normal] text-on-ink"
            >
              {payLabel}
            </button>
            <span className="-mt-[6px] text-center text-sm text-on-ink">{t("total.needTerms")}</span>
          </>
        )}
      </div>
    </>
  );
}
