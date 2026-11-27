// SEO yardımcıları: 7 dil hreflang + x-default + kanonik adres ve güvenli JSON-LD serileştirme.
import type { Metadata } from "next";
import { siteUrl } from "@/config/brand";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { asLocale } from "./intl";

export type PublicHref =
  | "/"
  | "/firsatlar"
  | "/gizlilik"
  | "/kosullar"
  | { pathname: "/firsatlar/[id]"; params: { id: string } }
  | { pathname: "/ucuslar/[nereden]/[nereye]"; params: { nereden: string; nereye: string } };

export function absoluteUrl(href: PublicHref, locale: string): string {
  const base = siteUrl();
  const path = getPathname({ href, locale: asLocale(locale) }).replace(/\/$/, "");
  return path ? `${base}${path}` : base;
}

/** Tüm 7 dil (tr, en, nl, de, fr, es, it) + x-default hreflang ve mevcut dilin kanonik adresi. */
export function alternatesFor(href: PublicHref, locale: string): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = absoluteUrl(href, l);
  }
  languages["x-default"] = absoluteUrl(href, routing.defaultLocale);
  return {
    canonical: absoluteUrl(href, locale),
    languages,
  };
}

/** `<script type="application/ld+json">` içinde güvenli JSON (script kırılmasını önlemek için `<` kaçar). */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
