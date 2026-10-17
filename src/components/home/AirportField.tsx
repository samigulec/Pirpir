"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { PlaceSuggestion } from "@/data/airports-core";

/** Seçilen yer: havalimanı kodu ya da "city:LON" ve gösterilen ad. */
export type Place = { code: string; label: string };
export type AirportValue = Place[];

export const MAX_PLACES = 3;

/**
 * Kiwi tarzı şehir alanı: yazdıkça dünya genelinde öneriler, birden fazla yer seçilebilir (etiket olarak).
 * Tek seçim varken ve alan odakta değilken tasarımdaki gibi düz metin görünür.
 */
export function AirportField({
  label,
  value,
  onChange,
  className,
  labelClassName,
  inputClassName,
  invalid,
  tone = "primary",
}: {
  label: string;
  value: AirportValue;
  onChange: (v: AirportValue) => void;
  className: string;
  labelClassName: string;
  inputClassName: string;
  invalid?: boolean;
  /** Etiket rengi: kalkış mavi, varış mercan */
  tone?: "primary" | "coral";
}) {
  const t = useTranslations("home.search");
  const id = useId();
  const locale = useLocale();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Öneriler sunucudan (dünya listesi), kısa gecikmeyle
  useEffect(() => {
    if (!focused || !text.trim()) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/places?q=${encodeURIComponent(text)}&lang=${locale}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((list: PlaceSuggestion[]) => {
          setItems(list.filter((s) => !value.some((v) => v.code === s.code)));
          setActive(0);
        })
        .catch(() => {});
    }, 120);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [text, focused, locale, value]);

  const add = (s: PlaceSuggestion) => {
    const next = [...value, { code: s.code, label: s.city }].slice(-MAX_PLACES);
    onChange(next);
    setText("");
    setItems([]);
    inputRef.current?.focus();
  };
  const remove = (code: string) => onChange(value.filter((v) => v.code !== code));

  const showChips = focused || value.length > 1;
  const chip =
    tone === "primary" ? "bg-primary text-white" : "bg-coral text-ink";

  return (
    <div
      className={`${className} relative cursor-text`}
      onClick={() => inputRef.current?.focus()}
    >
      <label htmlFor={`${id}-input`} className={labelClassName}>
        {label}
      </label>
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {showChips &&
          value.map((v) => (
            <span key={v.code} className={`inline-flex max-w-full items-center gap-1 rounded-pill py-[2px] pl-3 pr-1 text-[15px] font-extrabold ${chip}`}>
              <span className="truncate">{v.label}</span>
              <button
                type="button"
                aria-label={t("removePlace", { place: v.label })}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  remove(v.code);
                }}
                className="flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-white/25 p-0 text-current"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </span>
          ))}
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-activedescendant={items.length ? `${id}-${active}` : undefined}
          autoComplete="off"
          placeholder={showChips ? (value.length ? t("addPlace") : t("placePlaceholder")) : undefined}
          value={showChips ? text : (value[0]?.label ?? "")}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !text && value.length) {
              remove(value[value.length - 1].code);
              return;
            }
            // Öneriler henüz gelmeden Enter: formu göndermek yerine ilk eşleşmeyi seç
            if (e.key === "Enter" && !items.length && text.trim()) {
              e.preventDefault();
              fetch(`/api/places?q=${encodeURIComponent(text)}&lang=${locale}`)
                .then((r) => (r.ok ? r.json() : []))
                .then((list: PlaceSuggestion[]) => {
                  const first = list.find((s) => !value.some((v) => v.code === s.code));
                  if (first) add(first);
                })
                .catch(() => {});
              return;
            }
            if (!items.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % items.length); }
            if (e.key === "Enter") { e.preventDefault(); add(items[active]); }
            if (e.key === "Escape") setItems([]);
          }}
          className={`${inputClassName} ${showChips ? "min-w-[80px] flex-1" : "w-full"}`}
        />
      </div>
      {items.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 m-0 max-h-[360px] list-none overflow-y-auto rounded-[18px] bg-white p-[6px] shadow-search md:min-w-[340px]"
        >
          {items.map((s, i) => (
            <li
              key={s.code}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-[12px] px-3 py-2 ${i === active ? "bg-field" : ""}`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-extrabold text-ink">
                  {s.city}
                  {s.kind === "city" && <span className="font-bold text-muted"> · {t("allAirports")}</span>}
                </span>
                <span className="truncate text-[13px] font-semibold text-muted">
                  {s.kind === "city" ? s.detail : s.detail} · {s.country}
                </span>
              </span>
              <span className="flex-none font-display font-semibold text-primary">{s.kind === "city" ? "" : s.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
