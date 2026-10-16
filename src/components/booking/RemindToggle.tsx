"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function RemindToggle() {
  const t = useTranslations("confirm.remind");
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn(!on)}
      className={`min-h-[48px] cursor-pointer rounded-pill border-0 px-6 py-3 font-display text-[17px] font-semibold leading-[normal] ${
        on ? "bg-ink text-white" : "bg-white text-ink"
      }`}
    >
      {on ? t("on") : t("off")}
    </button>
  );
}
