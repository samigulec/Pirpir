import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "./Logo";

const widths = {
  page: "max-w-page",
  results: "max-w-results",
  form: "max-w-form",
} as const;

/** Sayfa başlığı: solda logo, sağda sayfaya özel kontroller. */
export function SiteHeader({
  width = "page",
  wrap = false,
  children,
}: {
  width?: keyof typeof widths;
  wrap?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <header
      className={`mx-auto flex ${widths[width]} items-center justify-between gap-4 px-6 py-[22px] ${wrap ? "flex-wrap" : ""}`}
    >
      <Logo />
      {children}
    </header>
  );
}

export function PillLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="box-border inline-flex min-h-[44px] items-center whitespace-nowrap rounded-pill bg-sky px-5 py-[10px] font-extrabold text-ink no-underline"
    >
      {children}
    </Link>
  );
}

export async function SignInLink() {
  const t = await getTranslations("common");
  return <PillLink href="#">{t("signIn")}</PillLink>;
}
