import { getTranslations } from "next-intl/server";

const STEPS = [
  { key: "search", n: 1, bg: "bg-sun" },
  { key: "pick", n: 2, bg: "bg-cheek" },
  { key: "fly", n: 3, bg: "bg-blue-soft" },
] as const;

export async function Steps() {
  const t = await getTranslations("home.steps");
  return (
    <section className="mx-auto max-w-page px-6 pt-[88px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 text-center">
        {STEPS.map((s) => (
          <div key={s.key} className="flex flex-col items-center gap-2">
            <span className={`flex h-14 w-14 items-center justify-center rounded-full font-display text-2xl font-bold ${s.bg}`}>{s.n}</span>
            <h3 className="m-0 font-display text-2xl font-semibold">{t(`${s.key}.title`)}</h3>
            <p className="m-0 text-muted">{t(`${s.key}.text`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
