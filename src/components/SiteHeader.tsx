import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { HeaderActions } from "./HeaderActions";

const widths = {
  page: "max-w-page",
  results: "max-w-results",
  form: "max-w-form",
} as const;

/**
 * Sayfa başlığı: solda logo, sağda ülke · dil · para birimi ve profil menüsü (her sayfada aynı).
 * `children` gerekirse bunların soluna eklenir.
 */
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
      <div className="flex items-center gap-2">
        {children}
        <HeaderActions />
      </div>
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


