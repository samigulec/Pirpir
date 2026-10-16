// Veri erişim katmanı. Şimdilik örnek veri döner; sonra gerçek uçuş API'sine
// (Duffel, Amadeus vb.) buradan bağlanılacak. Sayfalar veriyi yalnızca buradan alır.
import { defaultSearch, popularDestinations, popularRoutes } from "@/data/mock/home";
import { routes } from "@/data/mock/routes";

export type SearchParams = {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  pax?: string;
};

export function getPopularDestinations() {
  return popularDestinations;
}

export function getPopularRoutes() {
  return popularRoutes;
}

export function getDefaultSearch() {
  return defaultSearch;
}

export function searchHref(p: Partial<SearchParams> = {}): string {
  const q = new URLSearchParams();
  q.set("from", p.from ?? defaultSearch.from);
  q.set("to", p.to ?? defaultSearch.to);
  q.set("date", p.date ?? defaultSearch.date);
  const ret = p.returnDate === undefined ? defaultSearch.returnDate : p.returnDate;
  if (ret) q.set("return", ret);
  if (p.pax) q.set("pax", p.pax);
  return `/ara?${q.toString()}`;
}

export function routeHref(slug: { from: string; to: string }): string {
  return `/ucuslar/${slug.from}/${slug.to}`;
}

export function getRouteSlugs() {
  return routes.map((r) => ({ nereden: r.from.slug, nereye: r.to.slug }));
}

export function getRoute(from: string, to: string) {
  return routes.find((r) => r.from.slug === from && r.to.slug === to) ?? null;
}
