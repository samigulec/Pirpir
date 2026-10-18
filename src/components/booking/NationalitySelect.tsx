"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { countryOptions } from "@/data/countries";

export type CountryOptions = ReturnType<typeof countryOptions>;

/** Bölge göstergesi harfleriyle bayrak (çizim değil, sistemin emoji bayrağı). */
const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/** Aksan ve büyük/küçük harf duyarsız arama: "turk" → Türkiye, "duits" → Duitsland */
const fold = (s: string, locale: string) => s.toLocaleLowerCase(locale).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

/**
 * Uyruk seçimi: yazarak aranan, bayraklı açılır liste. Önce sık seçilenler, sonra tüm ülkeler.
 * Adlar sunucuda sayfa dilinde hazırlanıp gelir (sunucu ve tarayıcı aynı metni çizsin).
 * Formla gönderim için gizli alan `name` ile taşınır.
 */
export function NationalitySelect({
  options,
  value,
  onChange,
  name,
  className,
  labelId,
}: {
  options: CountryOptions;
  value: string;
  onChange: (code: string) => void;
  name?: string;
  className: string;
  /** Alanın görünen etiketi (label öğesi kullanılmaz: içindeki listeye tıklamak düğmeyi yeniden açardı) */
  labelId: string;
}) {
  const t = useTranslations("booking.passenger");
  const locale = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const selected = options.all.find((c) => c.code === value);

  // Arama yoksa: sık seçilenler + tüm ülkeler (başlıklarla); aramada tek düz liste
  const items = useMemo(() => {
    const q = fold(query.trim(), locale);
    if (!q) return [...options.common.map((c) => ({ ...c, group: "common" as const })), ...options.all.map((c) => ({ ...c, group: "all" as const }))];
    return options.all
      .filter((c) => fold(c.name, locale).includes(q) || c.code.toLowerCase() === q)
      .sort((a, b) => Number(!fold(a.name, locale).startsWith(q)) - Number(!fold(b.name, locale).startsWith(q)))
      .map((c) => ({ ...c, group: "all" as const }));
  }, [query, options, locale]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    search.current?.focus();
    // Seçili ülke görünsün
    const i = items.findIndex((c) => c.code === value);
    setActive(Math.max(0, i));
    requestAnimationFrame(() => list.current?.querySelector(`[data-i="${Math.max(0, i)}"]`)?.scrollIntoView({ block: "center" }));
    return () => document.removeEventListener("mousedown", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };
  const move = (d: number) => {
    const n = (active + d + items.length) % items.length;
    setActive(n);
    list.current?.querySelector(`[data-i="${n}"]`)?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div ref={box} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${id}-value`}
        onClick={() => setOpen((o) => !o)}
        className={`${className} flex w-full cursor-pointer items-center gap-2 text-left`}
      >
        {selected ? (
          <>
            <span aria-hidden="true" className="text-xl leading-none">{flag(selected.code)}</span>
            <span id={`${id}-value`} className="min-w-0 flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span id={`${id}-value`} className="flex-1 font-semibold text-muted">{t("nationalityPick")}</span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true" className={`flex-none transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 flex min-w-[260px] flex-col overflow-hidden rounded-[20px] bg-white shadow-search">
          <div className="border-0 border-b border-solid border-line p-2">
            <input
              ref={search}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-activedescendant={items.length ? `${id}-${active}` : undefined}
              aria-label={t("nationality")}
              placeholder={t("nationalitySearch")}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
                else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
                else if (e.key === "Enter") { e.preventDefault(); if (items[active]) pick(items[active].code); }
                else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
              }}
              className="box-border min-h-[44px] w-full rounded-[14px] border-2 border-solid border-line bg-field px-3 text-base font-bold text-ink focus:border-primary focus:outline-none"
            />
          </div>
          <ul ref={list} id={`${id}-list`} role="listbox" aria-label={t("nationality")} className="m-0 max-h-[300px] list-none overflow-y-auto p-[6px]">
            {items.length === 0 && <li className="px-3 py-3 text-sm font-semibold text-muted">{t("nationalityNone")}</li>}
            {items.map((c, i) => (
              <li key={c.group + c.code} role="presentation">
                {(i === 0 || items[i - 1].group !== c.group) && !query && (
                  <span className="block px-3 pb-1 pt-2 text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted">
                    {c.group === "common" ? t("nationalityCommon") : t("nationalityAll")}
                  </span>
                )}
                <span
                  id={`${id}-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={c.code === value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(c.code);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex min-h-[40px] cursor-pointer items-center gap-3 rounded-[12px] px-3 text-[15px] font-bold ${
                    i === active ? "bg-field" : ""
                  } ${c.code === value ? "text-primary" : "text-ink"}`}
                >
                  <span aria-hidden="true" className="text-lg leading-none">{flag(c.code)}</span>
                  <span className="flex-1">{c.name}</span>
                  {c.code === value && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
