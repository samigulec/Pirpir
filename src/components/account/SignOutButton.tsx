"use client";

import { signOut } from "@/actions/auth";
import { useAuthUi } from "../auth/LoginModal";

/** Hesap sayfasındaki çıkış: başlık sunucuyu beklemeden "Giriş yap"a döner, yönlendirme arkadan gelir. */
export function SignOutButton({ label, className }: { label: string; className: string }) {
  const { markSignedOut } = useAuthUi();
  return (
    <form action={signOut} onSubmit={markSignedOut}>
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
