"use client";

import { useAuthUi } from "./auth/LoginModal";

/** Sayfa içinde giriş penceresini açan buton (ör. Biletlerim). */
export function LoginButton({ className, children }: { className: string; children: React.ReactNode }) {
  const { openLogin } = useAuthUi();
  return (
    <button type="button" onClick={() => openLogin()} className={`cursor-pointer border-0 ${className}`}>
      {children}
    </button>
  );
}
