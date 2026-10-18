import { SiteHeader } from "./SiteHeader";
import { SimpleFooter } from "./SiteFooter";
import type { LegalDoc } from "@/content/legal/types";
import { withBrand } from "@/config/brand";

/** Gizlilik ve koşullar gibi metin sayfaları. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form" />
      <main className="mx-auto flex max-w-form flex-col gap-8 px-6 pb-20 pt-2">
        <div className="flex flex-col gap-2 rounded-[40px] bg-sky px-7 py-8">
          <h1 className="m-0 font-display text-[40px] font-bold leading-[1.1]">{doc.title}</h1>
          <span className="text-sm font-bold text-muted">{doc.updated}</span>
          <p className="m-0 text-lg">{withBrand(doc.intro)}</p>
        </div>
        <nav aria-label={doc.title} className="flex flex-wrap gap-2">
          {doc.sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-pill bg-field px-4 py-2 text-[15px] font-extrabold text-ink no-underline">
              {s.title}
            </a>
          ))}
        </nav>
        {doc.sections.map((s) => (
          <section key={s.id} id={s.id} className="flex scroll-mt-6 flex-col gap-3">
            <h2 className="m-0 font-display text-2xl font-semibold">{s.title}</h2>
            {s.body.length > 1 ? (
              <ul className="m-0 flex list-disc flex-col gap-2 pl-5">
                {s.body.map((p) => (
                  <li key={p}>{withBrand(p)}</li>
                ))}
              </ul>
            ) : (
              <p className="m-0">{withBrand(s.body[0])}</p>
            )}
          </section>
        ))}
      </main>
      <SimpleFooter />
    </div>
  );
}
