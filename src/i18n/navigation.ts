import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Dil farkında Link/yönlendirme: href'ler kanonik (Türkçe) yollarla yazılır, dile göre çevrilir.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
