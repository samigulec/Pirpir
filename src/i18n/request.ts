import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE } from "./config";
import { loadMessages } from "./messages";

// Şimdilik tek dil (Türkçe). Sayfalar statik kalsın diye çerez okunmuyor;
// İngilizce/Hollandaca çeviriler gelince next-intl yönlendirmesine (/en, /nl) geçilecek.
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  return { locale, messages: await loadMessages(locale) };
});
