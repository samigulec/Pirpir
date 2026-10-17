"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { payHeldBooking, type PayHeldState } from "@/actions/booking";

/** Fiyatı sabitlenmiş rezervasyonun ödemesi (onay sayfasında). */
export function PayHeldButton({ bookingId, total }: { bookingId: string; total: number }) {
  const t = useTranslations("confirm.held");
  const { fmt } = useCurrency();
  const [state, setState] = useState<PayHeldState>({});
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() => start(async () => setState(await payHeldBooking(bookingId)))}
        className="box-border flex min-h-[56px] cursor-pointer items-center justify-center rounded-pill border-0 bg-sun px-8 py-3 font-display text-xl font-semibold leading-[normal] text-ink disabled:cursor-wait disabled:opacity-80"
      >
        {pending ? t("paying") : t("pay", { price: fmt(total) })}
      </button>
      {state.error && (
        <span role="alert" className="text-center font-bold text-coral-text">
          {t(`errors.${state.error}`, { price: fmt(state.newTotal ?? 0) })}
        </span>
      )}
    </div>
  );
}
