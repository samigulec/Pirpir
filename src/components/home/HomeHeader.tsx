import { Logo } from "../Logo";
import { HeaderActions } from "../HeaderActions";

/**
 * Ana sayfa başlığı: logo ve sağda ülke · dil · para birimi ile profil menüsü. Ortadaki bağlantılar kaldırıldı;
 * ileride ürünler (uçuş, otel, araç) için sekmeler buraya gelecek.
 */
export function HomeHeader() {
  return (
    <>
      <header className="mx-auto hidden max-w-page items-center justify-between gap-4 px-6 py-[22px] md:flex">
        <Logo tight />
        <HeaderActions />
      </header>
      <header className="flex items-center justify-between px-5 pt-5 md:hidden">
        <Logo compact />
        <HeaderActions compact />
      </header>
    </>
  );
}
