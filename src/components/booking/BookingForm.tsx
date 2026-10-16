"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { Valiz } from "../characters";
import { Lock } from "../icons";
import { BankaIdealIcon, CuzdanGooglePayIcon, KartIcon, TelefonApplePayIcon } from "../payment";
import { idealBanks, nationalities, paymentMethods, phoneCodes, promoDiscount, type PaymentId } from "@/data/mock/booking";
import { placeOrder, type PlaceOrderState } from "@/app/rezervasyon/actions";
import type { PassengerSlot } from "@/lib/booking-validate";
import type { BagKind, Offer } from "@/lib/providers/types";
import { detectCardBrand, formatCardNumber } from "@/lib/card";
import { locative } from "@/lib/tr-suffix";

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
  offer,
  slots,
  testMode,
}: {
  offer: Offer;
  slots: PassengerSlot[];
  /** Örnek/test modunda ödeme alınmadığını belirten not gösterilir. */
  testMode: boolean;
}) {
  const t = useTranslations("booking");
  const { fmt } = useCurrency();
  const [bag, setBag] = useState<BagKind>("small");
  const [pay, setPay] = useState<PaymentId>("card");
  const [card, setCard] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<{ code: string; amount: number } | null>(null);
  const [promoError, setPromoError] = useState(false);
  const [terms, setTerms] = useState(false);
  const [state, setState] = useState<PlaceOrderState>({ errors: {} });
  const [pending, startTransition] = useTransition();

  const paying = slots.filter((s) => s.type !== "infant").length;
  const bagPrice = offer.bagOptions.find((b) => b.kind === bag)?.price ?? 0;
  const discount = promo?.amount ?? 0;
  const total = Math.max(0, offer.total + bagPrice * paying - discount);
  const brand = detectCardBrand(card);
  const payLabel = `${t(`payment.methods.${pay}.pay`)} · ${fmt(total)}`;
  const err = (name: string) => state.errors[name];
  const errText = (name: string) =>
    err(name) ? <span className="text-sm font-bold text-coral-text">{t(`errors.${err(name)}`)}</span> : null;
  const inv = (name: string) => (err(name) ? { "aria-invalid": true as const } : {});

  const applyPromo = () => {
    const amount = promoDiscount(promoCode);
    setPromo(amount ? { code: promoCode, amount } : null);
    setPromoError(!amount);
  };

  const counts = offer.query.pax;
  const paxText = [
    counts.adults && `${counts.adults} ${t("passenger.types.adult").toLocaleLowerCase("tr-TR")}`,
    counts.children && `${counts.children} ${t("passenger.types.child").toLocaleLowerCase("tr-TR")}`,
    counts.infants && `${counts.infants} ${t("passenger.types.infant").toLocaleLowerCase("tr-TR")}`,
  ].filter(Boolean).join(", ");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("bag", bag);
    if (promo) fd.set("promo", promo.code);
    startTransition(async () => {
      const res = await placeOrder(offer.id, fd);
      // Başarılı olursa sunucu onay sayfasına yönlendirir; buraya yalnızca hata döner.
      if (res) {
        setState(res);
        requestAnimationFrame(() => document.getElementById("booking-errors")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-[22px]">
      {/* Yolcu */}
      <section className="flex flex-col gap-3">
        <h2 className={h2}>{t("passenger.title")}</h2>
        {slots.map((slot, i) => {
          const k = (f: string) => `p${i}_${f}`;
          return (
            <fieldset key={i} className="m-0 flex flex-col gap-3 border-0 p-0">
              {slots.length > 1 && (
                <legend className="mb-1 p-0 font-display text-lg font-semibold text-muted">
                  {t("passenger.slot", { n: i + 1, type: t(`passenger.types.${slot.type}`) })}
                </legend>
              )}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                <label className={label}>
                  {t("passenger.firstName")}
                  <input type="text" name={k("given")} placeholder="Ayşe" autoComplete={i === 0 ? "given-name" : "off"} className={input} {...inv(k("given"))} />
                  {errText(k("given"))}
                </label>
                <label className={label}>
                  {t("passenger.lastName")}
                  <input type="text" name={k("family")} placeholder="Yılmaz" autoComplete={i === 0 ? "family-name" : "off"} className={input} {...inv(k("family"))} />
                  {errText(k("family"))}
                </label>
                <label className={label}>
                  {t("passenger.gender")}
                  <select name={k("gender")} className={input}>
                    <option value="f">{t("passenger.female")}</option>
                    <option value="m">{t("passenger.male")}</option>
                  </select>
                </label>
                <label className={label}>
                  {t("passenger.birth")}
                  <input type="text" name={k("birth")} inputMode="numeric" placeholder={t("passenger.birthPlaceholder")} autoComplete={i === 0 ? "bday" : "off"} className={input} {...inv(k("birth"))} />
                  {errText(k("birth"))}
                </label>
                <label className={label}>
                  {t("passenger.nationality")}
                  <select name={k("nationality")} className={input}>
                    {nationalities.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className={label}>
                  {t("passenger.passport")}
                  <input type="text" name={k("passport")} placeholder="U12345678" autoComplete="off" className={`${input} uppercase`} {...inv(k("passport"))} />
                  {errText(k("passport"))}
                </label>
              </div>
            </fieldset>
          );
        })}
        {offer.passportRequired && <span className="text-sm text-muted">{t("passenger.note")}</span>}
      </section>

      {/* İletişim */}
      <section className="flex flex-col gap-3">
        <h2 className={h2}>{t("contact.title")}</h2>
        <label className={label}>
          {t("contact.email")}
          <input type="email" name="email" placeholder="ayse@eposta.com" autoComplete="email" className={input} {...inv("email")} />
          {errText("email")}
        </label>
        <div className="flex flex-col gap-[6px]">
          <span id="tel-label" className="text-[15px] font-extrabold">{t("contact.phone")}</span>
          <div className="flex gap-2">
            <select name="phoneCode" aria-label={t("contact.phoneCode")} className={`${field} px-3 font-bold`}>
              {phoneCodes.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input type="tel" name="phone" aria-labelledby="tel-label" placeholder="6 1234 5678" autoComplete="tel-national" className={`${input} min-w-0 flex-1`} {...inv("phone")} />
          </div>
          {errText("phone")}
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
          {offer.bagOptions.map((b) => {
            const on = bag === b.kind;
            return (
              <button
                key={b.kind}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setBag(b.kind)}
                className={`flex min-h-[120px] cursor-pointer flex-col items-start rounded-[22px] border-[3px] border-solid px-5 py-[18px] text-left text-ink ${
                  on ? "border-coral bg-coral-soft" : "border-line bg-white"
                }`}
              >
                <span className="font-display text-[19px] font-semibold">{t(`bags.options.${b.kind}.title`)}</span>
                <span className="text-sm font-semibold">{t(`bags.options.${b.kind}.desc`)}</span>
                <span className="mt-[6px] font-extrabold">{b.price === 0 ? t("bags.free") : `+ ${fmt(b.price)}`}</span>
              </button>
            );
          })}
        </div>
        {offer.outbound.via && (
          <span className="text-sm text-muted">{t("bags.transferNote", { place: locative(offer.outbound.via.city) })}</span>
        )}
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyPromo();
              }
            }}
            className="box-border min-h-[52px] flex-[1_1_200px] rounded-[16px] border-2 border-solid border-line bg-white px-4 py-3 font-bold uppercase text-ink"
          />
          <button
            type="button"
            onClick={applyPromo}
            className="min-h-[52px] cursor-pointer rounded-[16px] border-0 bg-ink px-[22px] py-3 font-display text-[17px] font-semibold leading-[normal] text-white"
          >
            {t("promo.apply")}
          </button>
        </div>
        {promo && (
          <span role="status" className="mt-[10px] block font-extrabold text-green-text">
            {t("promo.applied", { amount: fmt(promo.amount) })}
          </span>
        )}
        {promoError && (
          <span role="alert" className="mt-[10px] block font-extrabold text-coral-text">
            {t("promo.invalid")}
          </span>
        )}
      </details>

      {(state.message || Object.keys(state.errors).length > 0) && (
        <div id="booking-errors" role="alert" className="rounded-[20px] bg-coral-soft px-5 py-4 font-bold text-ink">
          {t(`errors.${state.message ?? "summary"}`)}
        </div>
      )}

      {/* Toplam */}
      <div className="flex flex-col gap-4 rounded-[28px] bg-ink px-6 py-[22px] text-white">
        <div className="flex flex-col gap-[6px] border-0 border-b border-solid border-ink-soft pb-[14px] font-bold">
          <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.ticket", { pax: paxText, trip: t(offer.inbound ? "trip.rt" : "trip.ow") })}</span><span>{fmt(offer.total)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-on-ink">{paying > 1 ? t("total.bagPerPax", { n: paying }) : t("total.bag")}</span><span>{bagPrice === 0 ? t("bags.free") : fmt(bagPrice * paying)}</span></div>
          {promo && (
            <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.promo")}</span><span className="text-green-light">− {fmt(discount)}</span></div>
          )}
          <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.taxes")}</span><span>{t("total.included")}</span></div>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-on-ink">{t("total.total")}</span>
          <span aria-live="polite" className="font-display text-[38px] font-bold leading-[1.1]">{fmt(total)}</span>
        </div>
        <label className="flex cursor-pointer items-start gap-[10px] text-[15px] font-semibold">
          <input type="checkbox" name="terms" checked={terms} onChange={() => setTerms(!terms)} className="m-0 mt-[1px] h-[22px] w-[22px] flex-none accent-sun" />
          <span>
            {t.rich("total.terms", {
              terms: (c) => <a href="#" className="text-sun">{c}</a>,
              privacy: (c) => <a href="#" className="text-sun">{c}</a>,
            })}
          </span>
        </label>
        {terms ? (
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="box-border flex min-h-[60px] cursor-pointer items-center justify-center rounded-pill border-0 bg-sun px-8 py-[14px] font-display text-[21px] font-semibold leading-[normal] text-ink disabled:cursor-wait disabled:opacity-80"
          >
            {pending ? t("processing") : payLabel}
          </button>
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
        {testMode && <span className="text-center text-sm text-on-ink">{t("testNotice")}</span>}
      </div>
    </form>
  );
}
