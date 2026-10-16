import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { AccountPill } from "./AccountLinks";

const widths = {
  page: "max-w-page",
  results: "max-w-results",
  form: "max-w-form",
} as const;

/** Sayfa başlığı: solda logo, sağda sayfaya özel kontroller. Dar ekranda kontroller alt satıra geçer. */
export function SiteHeader({
  width = "page",
  children,
}: {
  width?: keyof typeof widths;
  children?: React.ReactNode;
}) {
  return (
    <header className={`mx-auto flex ${widths[width]} flex-wrap items-center justify-between gap-4 px-6 py-[22px]`}>
      <Logo />
      {children}
    </header>
  );
}

export function PillLink({ href, children }: { href: ComponentProps<typeof Link>["href"]; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="box-border inline-flex min-h-[44px] items-center whitespace-nowrap rounded-pill bg-sky px-5 py-[10px] font-extrabold text-ink no-underline"
    >
      {children}
    </Link>
  );
}

/** Tasarımdaki "Giriş yap" butonu; girişliyse "Hesabım". */
export function SignInLink() {
  return <AccountPill />;
}
