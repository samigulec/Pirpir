"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { Share } from "../icons";

/**
 * Paylaş penceresi: metnin önizlemesi, telefonun paylaşma menüsü (destekleniyorsa PDF dosyasıyla),
 * WhatsApp, e-posta ve kopyala. Rezervasyon kodu paylaşılan metinde yoktur.
 */
export function ShareTrip({
  bookingId,
  title,
  text,
  fileName,
  className,
}: {
  bookingId: string;
  title: string;
  text: string;
  fileName: string;
  className: string;
}) {
  const t = useTranslations("confirm.shareSheet");
  const tc = useTranslations("confirm");
  const locale = useLocale();
  const { cur } = useCurrency();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [copied, setCopied] = useState(false);
  const [canApps, setCanApps] = useState(false);
  const [canFiles, setCanFiles] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    setCanApps(typeof navigator.share === "function");
    try {
      setCanFiles(!!navigator.canShare?.({ files: [new File([""], "x.pdf", { type: "application/pdf" })] }));
    } catch {
      setCanFiles(false);
    }
  }, []);

  const full = `${title}\n${text}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  const shareApps = async () => {
    try {
      await navigator.share({ title, text: full });
    } catch {
      // Kullanıcı vazgeçti
    }
  };
  const sharePdf = async () => {
    setPdfBusy(true);
    try {
      const res = await fetch(`/api/bilet-pdf/${encodeURIComponent(bookingId)}?lang=${locale}&cur=${cur}`);
      const file = new File([await res.blob()], fileName, { type: "application/pdf" });
      await navigator.share({ title, text: full, files: [file] });
    } catch {
      // Vazgeçildi ya da paylaşılamadı
    } finally {
      setPdfBusy(false);
    }
  };

  const option =
    "flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] border-0 px-4 py-3 font-display text-[17px] font-semibold leading-[normal] no-underline disabled:cursor-wait disabled:opacity-70";

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={className}>
        <Share />
        {tc("share")}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
        className="m-auto box-border max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[480px] overflow-y-auto rounded-[28px] border-0 bg-white p-0 text-ink shadow-search backdrop:bg-ink/50"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="m-0 font-display text-2xl font-semibold">{t("title")}</h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label={t("close")}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-field text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-1 rounded-[20px] bg-sky px-5 py-4">
            <span className="font-display text-xl font-semibold">{title}</span>
            <span className="whitespace-pre-line text-[15px] font-semibold text-ink-soft">{text}</span>
          </div>
          <span className="-mt-2 text-[13px] font-semibold text-muted">{t("noCode")}</span>

          <div className="grid grid-cols-2 gap-2">
            {canFiles && (
              <button type="button" onClick={sharePdf} disabled={pdfBusy} className={`${option} col-span-2 bg-primary text-white`}>
                {pdfBusy ? t("pdfLoading") : t("pdf")}
              </button>
            )}
            {canApps && (
              <button type="button" onClick={shareApps} className={`${option} col-span-2 ${canFiles ? "bg-field text-ink" : "bg-primary text-white"}`}>
                {t("apps")}
              </button>
            )}
            <a href={`https://wa.me/?text=${encodeURIComponent(full)}`} target="_blank" rel="noopener noreferrer" className={`${option} bg-field text-ink`}>
              {t("whatsapp")}
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(t("subject", { route: title }))}&body=${encodeURIComponent(full)}`} className={`${option} bg-field text-ink`}>
              {t("email")}
            </a>
            <button type="button" onClick={copy} className={`${option} col-span-2 bg-field text-ink`}>
              <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
