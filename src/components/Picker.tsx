"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";

export type PickerItem = {
  value: string;
  label: string;
  /** Sağda ya da altta soluk ek bilgi (ör. "Turkish", "Euro") */
  hint?: string;
  /** Soldaki simge: bayrak için ülke kodu, ya da kısa metin (₺, EN) */
  icon?: { flag: string } | { text: string };
  /** Bölüm başlığı (ör. "Sık seçilenler"); aynı başlıklılar art arda gelir */
  group?: string;
  /** Aramada ayrıca eşleşecek metin (ör. ülke kodu, İngilizce ad) */
  keywords?: string;
};

/** Bölge göstergesi harfleriyle bayrak emojisi */
const flagEmoji = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

let flagSupport: boolean | undefined;
/**
 * Sistem bayrak emojisini çiziyor mu? Windows'un emoji yazı tipinde bayrak yok; orada harfler (T R) çıkar.
 * Tuvalde bir bayrak çizilip renkli piksel aranır; renk yoksa bayrak yerine kısa kod gösterilir.
 */
function detectFlags(): boolean {
  if (flagSupport !== undefined) return flagSupport;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 24;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return (flagSupport = false);
    ctx.font = "20px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000";
    ctx.fillText(flagEmoji("TR"), 0, 0);
    const d = ctx.getImageData(0, 0, 24, 24).data;
    flagSupport = false;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 0 && (Math.abs(d[i] - d[i + 1]) > 40 || Math.abs(d[i] - d[i + 2]) > 40)) {
        flagSupport = true;
        break;
      }
    }
  } catch {
    flagSupport = false;
  }
  return flagSupport;
}

export function useFlagSupport() {
  // Sunucuda ve ilk çizimde bayrak varsayılır; tarayıcı desteklemiyorsa hemen koda geçer
  const [ok, setOk] = useState(true);
  useEffect(() => setOk(detectFlags()), []);
  return ok;
}

export function PickerIcon({ icon, size = "md" }: { icon?: PickerItem["icon"]; size?: "md" | "lg" }) {
  const flags = useFlagSupport();
  if (!icon) return null;
  if ("flag" in icon && flags) {
    return (
      <span aria-hidden="true" className={`flex-none leading-none ${size === "lg" ? "text-xl" : "text-lg"}`}>
        {flagEmoji(icon.flag)}
      </span>
    );
  }
  const text = "flag" in icon ? icon.flag.toUpperCase() : icon.text;
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[22px] min-w-[30px] flex-none items-center justify-center rounded-[6px] bg-sky px-1 text-[12px] font-extrabold tracking-[0.02em] text-primary"
    >
      {text}
    </span>
  );
}

/** Aksan ve büyük/küçük harf duyarsız arama: "turk" → Türkiye, "duits" → Duitsland */
const fold = (s: string, locale: string) =>
  s.toLocaleLowerCase(locale).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

/**
 * Sitenin açılır seçim kutusu (uyruk, ülke, dil, para birimi): seçili değer simgesiyle görünür, tıklayınca
 * yuvarlak köşeli bir liste açılır. Uzun listelerde yazarak arama vardır. Klavye: oklar, Enter, Esc.
 * `inline`: liste alanın altında akışta açılır (pencere içinde kesilmesin diye).
 */
export function Picker({
  items,
  value,
  onChange,
  labelId,
  className,
  name,
  placeholder,
  searchPlaceholder,
  emptyText,
  inline = false,
  disabled = false,
}: {
  items: PickerItem[];
  value: string;
  onChange: (value: string) => void;
  /** Görünen etiketin kimliği (label öğesi kullanılmaz: listeye tıklamak düğmeyi yeniden açardı) */
  labelId: string;
  className: string;
  /** Formla gönderim için gizli alan */
  name?: string;
  placeholder?: string;
  /** Verilirse arama kutusu gösterilir */
  searchPlaceholder?: string;
  emptyText?: string;
  inline?: boolean;
  disabled?: boolean;
}) {
  const locale = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = items.find((c) => c.value === value);

  // Aramada başlıksız düz liste (aynı değer iki bölümde olabilir: bir kez gösterilir), adı aramayla başlayanlar önce
  const shown = useMemo(() => {
    const q = fold(query.trim(), locale);
    if (!q) return items;
    const seen = new Set<string>();
    return items
      .filter((c) => !seen.has(c.value) && !!seen.add(c.value))
      .filter((c) => fold(`${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`, locale).includes(q))
      .sort((a, b) => Number(!fold(a.label, locale).startsWith(q)) - Number(!fold(b.label, locale).startsWith(q)))
      .map((c) => ({ ...c, group: undefined }));
  }, [query, items, locale]);

  const scrollTo = (i: number, block: ScrollLogicalPosition) =>
    list.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    (search.current ?? list.current)?.focus();
    const i = Math.max(0, shown.findIndex((c) => c.value === value));
    setActive(i);
    requestAnimationFrame(() => scrollTo(i, "center"));
    return () => document.removeEventListener("mousedown", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    trigger.current?.focus();
  };
  const pick = (v: string) => {
    onChange(v);
    close();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = (active + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length;
      setActive(n);
      scrollTo(n, "nearest");
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) pick(shown[active].value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // pencere içindeyse pencere kapanmasın, yalnız liste kapansın
      close();
    }
  };

  const panel = (
    <div
      className={`flex flex-col overflow-hidden rounded-[20px] bg-white ${
        inline ? "mt-2 border-2 border-solid border-line" : "absolute left-0 right-0 top-[calc(100%+6px)] z-30 min-w-[260px] shadow-search"
      }`}
    >
      {searchPlaceholder && (
        <div className="border-0 border-b border-solid border-line p-2">
          <input
            ref={search}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-activedescendant={shown.length ? `${id}-${active}` : undefined}
            aria-labelledby={labelId}
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            className="box-border min-h-[44px] w-full rounded-[14px] border-2 border-solid border-line bg-field px-3 text-base font-bold text-ink focus:border-primary focus:outline-none"
          />
        </div>
      )}
      <ul
        ref={list}
        id={`${id}-list`}
        role="listbox"
        aria-labelledby={labelId}
        tabIndex={searchPlaceholder ? -1 : 0}
        aria-activedescendant={!searchPlaceholder && shown.length ? `${id}-${active}` : undefined}
        onKeyDown={searchPlaceholder ? undefined : onKey}
        className={`m-0 list-none overflow-y-auto p-[6px] focus:outline-none ${items.length <= 8 ? "" : inline ? "max-h-[240px]" : "max-h-[300px]"}`}
      >
        {shown.length === 0 && <li className="px-3 py-3 text-sm font-semibold text-muted">{emptyText}</li>}
        {shown.map((c, i) => (
          <li key={`${c.group ?? ""}:${c.value}`} role="presentation">
            {c.group && (i === 0 || shown[i - 1].group !== c.group) && (
              <span className="block px-3 pb-1 pt-2 text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted">{c.group}</span>
            )}
            <span
              id={`${id}-${i}`}
              data-i={i}
              role="option"
              aria-selected={c.value === value}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c.value);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[12px] px-3 text-[15px] font-bold ${i === active ? "bg-field" : ""} ${
                c.value === value ? "text-primary" : "text-ink"
              }`}
            >
              <PickerIcon icon={c.icon} />
              <span className="min-w-0 flex-1">
                {c.label}
                {c.hint && <span className="ml-2 text-[13px] font-semibold text-muted">{c.hint}</span>}
              </span>
              {c.value === value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div ref={box} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${id}-value`}
        onClick={() => (open ? close() : setOpen(true))}
        className={`${className} flex w-full cursor-pointer items-center gap-2 text-left disabled:cursor-wait disabled:opacity-70`}
      >
        {selected ? (
          <>
            <PickerIcon icon={selected.icon} size="lg" />
            <span id={`${id}-value`} className="min-w-0 flex-1 truncate">{selected.label}</span>
          </>
        ) : (
          <span id={`${id}-value`} className="flex-1 font-semibold text-muted">{placeholder}</span>
        )}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`flex-none transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && panel}
    </div>
  );
}

