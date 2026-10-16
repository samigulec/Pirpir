"use client";

import { useId, useState } from "react";
import { useLocale } from "next-intl";
import { cityName, countryName, suggestAirports, type Airport } from "@/data/airports";

export type AirportValue = { text: string; code?: string };

/** Şehir/havalimanı alanı: yazdıkça öneri listesi (ARIA combobox). */
export function AirportField({
  label,
  value,
  onChange,
  className,
  labelClassName,
  inputClassName,
  invalid,
}: {
  label: string;
  value: AirportValue;
  onChange: (v: AirportValue) => void;
  className: string;
  labelClassName: string;
  inputClassName: string;
  invalid?: boolean;
}) {
  const id = useId();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const items = open ? suggestAirports(value.text) : [];

  const pick = (a: Airport) => {
    onChange({ text: cityName(a, locale), code: a.code });
    setOpen(false);
  };

  return (
    <label className={`${className} relative`}>
      <span className={labelClassName}>{label}</span>
      <input
        type="text"
        role="combobox"
        aria-expanded={items.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        aria-activedescendant={items.length ? `${id}-${active}` : undefined}
        autoComplete="off"
        value={value.text}
        onChange={(e) => {
          onChange({ text: e.target.value });
          setOpen(true);
          setActive(0);
        }}
        onFocus={(e) => e.target.select()}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!items.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % items.length); }
          if (e.key === "Enter") { e.preventDefault(); pick(items[active]); }
          if (e.key === "Escape") setOpen(false);
        }}
        className={inputClassName}
      />
      {items.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 m-0 list-none overflow-hidden rounded-[18px] bg-white p-[6px] shadow-search"
        >
          {items.map((a, i) => (
            <li
              key={a.code}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(a); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-[12px] px-3 py-2 ${i === active ? "bg-field" : ""}`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-extrabold text-ink">{cityName(a, locale)}</span>
                <span className="truncate text-[13px] font-semibold text-muted">{a.name} · {countryName(a.country, locale)}</span>
              </span>
              <span className="font-display font-semibold text-primary">{a.code}</span>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
