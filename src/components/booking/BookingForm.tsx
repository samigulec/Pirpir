"use client";

import { useState, useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { useCurrency } from "../CurrencyProvider";
import { Valiz } from "../characters";
import { Lock } from "../icons";
import {
  AmexMark,
  ApplePayMark,
  BankaIdealIcon,
  CuzdanGooglePayIcon,
  GooglePayMark,
  IdealMark,
  KartIcon,
  MastercardMark,
  TelefonApplePayIcon,
  VisaMark,
} from "../payment";
import { idealBanks, nationalities, paymentMethods, phoneCodes, promoDiscount, type PaymentId } from "@/data/mock/booking";
import { placeOrder, type PlaceOrderState } from "@/actions/booking";
import type { PassengerSlot } from "@/lib/booking-validate";
import type { BagChoice, BagOffer, Offer, SeatChoice, SeatMap } from "@/lib/providers/types";
import { bagsCost, NO_BAGS, seatsCost, wantedBagsExtra } from "@/lib/extras";
import { CabinBagIcon, CheckedBagIcon, PersonalItemIcon } from "../results/BagIcons";
import { SeatPicker } from "./SeatPicker";
import { useBagSpecText } from "../results/BagRules";
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

type Mark = React.ComponentType<React.SVGProps<SVGSVGElement>>;
/** Yöntemin kabul ettiği markalar (resmi işaretler, yükseklikleri görsel olarak dengelenmiş). */
const PAY_MARKS: Record<PaymentId, { Mark: Mark; h: number }[]> = {
  card: [{ Mark: VisaMark, h: 12 }, { Mark: MastercardMark, h: 20 }, { Mark: AmexMark, h: 20 }],
  ideal: [{ Mark: IdealMark, h: 22 }],
  apple: [{ Mark: ApplePayMark, h: 20 }],
  google: [{ Mark: GooglePayMark, h: 20 }],
};
const CARD_MARK: Record<NonNullable<ReturnType<typeof detectCardBrand>>, Mark> = { Visa: VisaMark, Mastercard: MastercardMark, Amex: AmexMark };

export function BookingForm({
  offer,
  slots,
  testMode,
  defaultEmail,
  viaCity,
  seatMaps,
  wantBags,
  cityNames,
}: {
  offer: Offer;
  slots: PassengerSlot[];
  /** Örnek/test modunda ödeme alınmadığını belirten not gösterilir. */
  testMode: boolean;
  /** Girişliyse e-posta önceden dolu gelir. */
  defaultEmail?: string;
  /** Gidişteki aktarma şehrinin yerel adı (bagaj notu için) */
  viaCity?: string;
  seatMaps: SeatMap[];
  /** Sonuçlardaki bagaj filtresi: her yolcu için önceden seçilir. */
  wantBags: BagChoice;
  cityNames: Record<string, string>;
}) {
  const t = useTranslations("booking");
  const { fmt } = useCurrency();
  const payingSlots = slots.filter((s) => s.type !== "infant");
  const [bags, setBags] = useState<BagChoice[]>(() =>
    payingSlots.map(() => wantedBagsExtra(offer.bags, wantBags)?.choice ?? NO_BAGS),
  );
  const [seats, setSeats] = useState<SeatChoice[]>([]);
  const [holdMode, setHoldMode] = useState(false);
  const [pay, setPay] = useState<PaymentId>("card");
  const [card, setCard] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<{ code: string; amount: number } | null>(null);
  const [promoError, setPromoError] = useState(false);
  const [terms, setTerms] = useState(false);
  const [state, setState] = useState<PlaceOrderState>({ errors: {} });
  const [pending, startTransition] = useTransition();

  const bagTotal = bagsCost(offer.bags, bags);
  const seatTotal = seatsCost(seatMaps, seats, payingSlots.length) ?? 0;
  const discount = promo?.amount ?? 0;
  const total = Math.max(0, offer.total + bagTotal + seatTotal - discount);
  const paxLabel = (i: number) =>
    payingSlots.length > 1 ? t("bags.paxTitle", { n: i + 1, type: t(`passenger.types.${payingSlots[i].type}`) }) : t(`passenger.types.${payingSlots[i].type}`);
  const setBag = (i: number, patch: Partial<BagChoice>) => setBags((l) => l.map((b, k) => (k === i ? { ...b, ...patch } : b)));
  const brand = detectCardBrand(card);
  const payLabel = holdMode ? t("hold.button") : `${t(`payment.methods.${pay}.pay`)} · ${fmt(total)}`;
  const locale = useLocale();
  const payBy = offer.hold ? formatDateTime(offer.hold.payBy, intlLocale(locale)) : "";
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
    fd.set("bags", JSON.stringify(bags));
    fd.set("seats", JSON.stringify(seats));
    fd.set("hold", holdMode ? "1" : "0");
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
          <input type="email" name="email" defaultValue={defaultEmail} placeholder="ayse@eposta.com" autoComplete="email" className={input} {...inv("email")} />
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
        {payingSlots.map((_, i) => (
          <BagPicker key={i} title={payingSlots.length > 1 ? paxLabel(i) : undefined} bags={offer.bags} specs={offer.bagSpecs} value={bags[i]} onChange={(patch) => setBag(i, patch)} />
        ))}
        {offer.inbound && <span className="text-sm text-muted">{t("bags.roundTripNote")}</span>}
        {errText("bag")}
        {viaCity && (
          <span className="text-sm text-muted">{t("bags.transferNote", { place: locative(viaCity!), city: viaCity! })}</span>
        )}
      </section>

      {/* Koltuk */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col">
          <h2 className={h2}>{t("seats.title")}</h2>
          <span className="text-[15px] text-muted">{t("seats.subtitle")}</span>
        </div>
        {seatMaps.length ? (
          <SeatPicker maps={seatMaps} passengers={payingSlots.map((_, i) => paxLabel(i))} cityNames={cityNames} value={seats} onChange={setSeats} />
        ) : (
          <span className="rounded-[20px] bg-field px-5 py-4 font-bold text-muted">{t("seats.none")}</span>
        )}
        {errText("seats")}
      </section>

      {/* Ne zaman ödenecek: havayolu izin veriyorsa fiyatı sabitleyip sonra ödeme */}
      {offer.hold && (
        <section className="flex flex-col gap-3">
          <h2 className={h2}>{t("hold.title")}</h2>
          <div role="radiogroup" aria-label={t("hold.title")} className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[10px]">
            {[false, true].map((later) => {
              const on = holdMode === later;
              return (
                <button
                  key={String(later)}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setHoldMode(later)}
                  className={`flex min-h-[120px] cursor-pointer flex-col items-start gap-1 rounded-[22px] border-[3px] border-solid px-5 py-4 text-left text-ink ${on ? "border-primary bg-sky" : "border-line bg-white"}`}
                >
                  <span className="font-display text-[19px] font-semibold">{t(later ? "hold.later" : "hold.now")}</span>
                  <span className="text-sm font-semibold">{later ? t("hold.laterDesc", { date: payBy }) : t("hold.nowDesc")}</span>
                  {later && (
                    <span className="text-sm font-semibold text-muted">{t(offer.hold!.priceGuaranteedUntil ? "hold.guaranteed" : "hold.notGuaranteed")}</span>
                  )}
                  {later && <span className="mt-auto font-extrabold text-green-text">{t("hold.free")}</span>}
                </button>
              );
            })}
          </div>
          {holdMode && <span className="text-sm text-muted">{t("hold.note")}</span>}
          {errText("hold")}
        </section>
      )}

      {/* Ödeme (fiyat sabitlemede ödeme sonra alınır) */}
      {!holdMode && (
        <>
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
                  <span className="flex flex-wrap items-center gap-2">
                    {PAY_MARKS[p].map(({ Mark, h }, i) => (
                      <Mark key={i} height={h} className="w-auto flex-none" />
                    ))}
                  </span>
                  {/* Kartta markalar zaten görünüyor; yazı yalnızca ekran okuyucu için */}
                  <span className={`text-[13px] font-bold text-muted ${p === "card" ? "sr-only" : ""}`}>{t(`payment.methods.${p}.sub`)}</span>
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
                    {brand ? <CardMark brand={brand} /> : t("payment.cardType")}
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
        </>
      )}

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
          <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.bags")}</span><span>{bagTotal === 0 ? "—" : fmt(bagTotal)}</span></div>
          {seats.length > 0 && (
            <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.seats")}</span><span>{seatTotal === 0 ? t("bags.free") : fmt(seatTotal)}</span></div>
          )}
          {promo && (
            <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.promo")}</span><span className="text-green-light">− {fmt(discount)}</span></div>
          )}
          <div className="flex justify-between gap-3"><span className="text-on-ink">{t("total.taxes")}</span><span>{t("total.included")}</span></div>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-on-ink">{t("total.total")}</span>
          <span aria-live="polite" className="font-display text-[38px] font-bold leading-[1.1]">{fmt(total)}</span>
          {holdMode && (
            <span className="mt-1 flex flex-col text-sm font-bold text-on-ink">
              <span>{t("hold.payNow")}: {fmt(0)}</span>
              <span>{t("hold.payLater", { date: payBy })}: {fmt(total)}</span>
            </span>
          )}
        </div>
        <label className="flex cursor-pointer items-start gap-[10px] text-[15px] font-semibold">
          <input type="checkbox" name="terms" checked={terms} onChange={() => setTerms(!terms)} className="m-0 mt-[1px] h-[22px] w-[22px] flex-none accent-sun" />
          <span>
            {t.rich("total.terms", {
              terms: (c) => <Link href="/kosullar" target="_blank" className="text-sun">{c}</Link>,
              privacy: (c) => <Link href="/gizlilik" target="_blank" className="text-sun">{c}</Link>,
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

/** Bir yolcunun bagajı: kabin (kişisel eşya ya da el bagajı paketi) ve kontrol edilen bagaj adedi. */
export function BagPicker({
  title,
  bags,
  specs,
  value,
  onChange,
}: {
  title?: string;
  bags: Offer["bags"];
  specs?: Offer["bagSpecs"];
  value: BagChoice;
  onChange: (p: Partial<BagChoice>) => void;
}) {
  const t = useTranslations("booking.bags");
  const spec = useBagSpecText();
  const { fmt } = useCurrency();
  const card = (on: boolean) =>
    `flex min-h-[120px] flex-col items-start gap-1 rounded-[22px] border-[3px] border-solid px-5 py-4 text-left text-ink ${on ? "border-coral bg-coral-soft" : "border-line bg-white"}`;
  const priceText = (b: BagOffer) => (b.price === undefined ? t("unavailable") : `+ ${fmt(b.price)}`);
  const cabinIncluded = bags.cabin.included > 0;
  const cabinBuyable = bags.cabin.max > 0 && bags.cabin.price !== undefined;
  const checkedBuyable = bags.checked.max > 0 && bags.checked.price !== undefined;
  const checkedLabel = t("checkedTitle");

  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      {title && <legend className="mb-1 p-0 font-display text-lg font-semibold text-muted">{title}</legend>}
      <span className="text-[15px] font-extrabold">{t("cabinTitle")}</span>
      <div role="radiogroup" aria-label={t("cabinTitle")} className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px]">
        {!cabinIncluded && (
          <button type="button" role="radio" aria-checked={value.cabin === 0} onClick={() => onChange({ cabin: 0 })} className={`${card(value.cabin === 0)} cursor-pointer`}>
            <PersonalItemIcon />
            <span className="font-display text-[19px] font-semibold">{t("personal")}</span>
            <span className="text-sm font-semibold">{t("personalDesc")}</span>
            {specs?.personal?.dims && <span className="text-[13px] font-bold text-muted">{spec.size(specs.personal)}</span>}
            <span className="mt-auto font-extrabold">{t("included")}</span>
          </button>
        )}
        <button
          type="button"
          role="radio"
          aria-checked={cabinIncluded || value.cabin === 1}
          disabled={!cabinIncluded && !cabinBuyable}
          onClick={() => !cabinIncluded && onChange({ cabin: 1 })}
          className={`${card(cabinIncluded || value.cabin === 1)} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className="flex gap-1"><PersonalItemIcon /><CabinBagIcon /></span>
          <span className="font-display text-[19px] font-semibold">{t("cabinPack")}</span>
          <span className="text-sm font-semibold">{bags.cabin.kg ? t("cabinPackDesc", { kg: bags.cabin.kg }) : t("cabinPackDescNoKg")}</span>
          {specs?.cabin?.dims && <span className="text-[13px] font-bold text-muted">{spec.size(specs.cabin)}</span>}
          <span className="mt-auto font-extrabold">{cabinIncluded ? t("included") : priceText(bags.cabin)}</span>
        </button>
      </div>

      <span className="text-[15px] font-extrabold">{checkedLabel}</span>
      <div
        className={`flex flex-wrap items-center gap-3 rounded-[22px] border-[3px] border-solid px-5 py-4 text-ink ${
          value.checked > 0 || bags.checked.included > 0 ? "border-coral bg-coral-soft" : "border-line bg-white"
        }`}
      >
        <CheckedBagIcon />
        <span className="flex min-w-[160px] flex-1 flex-col">
          <span className="font-display text-[19px] font-semibold">
            {bags.checked.kg ? t("checkedDesc", { kg: bags.checked.kg }) : t("checkedDescNoKg")}
          </span>
          {spec.size(specs?.checked) && <span className="text-[13px] font-bold text-muted">{spec.size(specs?.checked)}</span>}
          <span className="text-sm font-semibold">
            {[bags.checked.included > 0 && t("includedCount", { n: bags.checked.included }), checkedBuyable && t("perBag", { price: fmt(bags.checked.price!) })]
              .filter(Boolean)
              .join(" · ") || t("unavailable")}
          </span>
        </span>
        {checkedBuyable && (
          <span className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t("remove", { label: checkedLabel })}
              disabled={value.checked === 0}
              onClick={() => onChange({ checked: value.checked - 1 })}
              className="h-11 w-11 cursor-pointer rounded-full border-2 border-solid border-primary bg-white text-xl font-extrabold leading-none text-primary disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
            >
              −
            </button>
            <span aria-live="polite" className="w-6 text-center font-display text-xl font-semibold">{value.checked}</span>
            <button
              type="button"
              aria-label={t("add", { label: checkedLabel })}
              disabled={value.checked >= bags.checked.max}
              onClick={() => onChange({ checked: value.checked + 1 })}
              className="h-11 w-11 cursor-pointer rounded-full border-2 border-solid border-primary bg-white text-xl font-extrabold leading-none text-primary disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
            >
              +
            </button>
          </span>
        )}
      </div>
    </fieldset>
  );
}

/** Kart numarasından tanınan markanın işareti */
function CardMark({ brand }: { brand: NonNullable<ReturnType<typeof detectCardBrand>> }) {
  const M = CARD_MARK[brand];
  return (
    <span className="flex items-center gap-1">
      <M height={brand === "Visa" ? 12 : 20} className="w-auto" />✓
    </span>
  );
}
