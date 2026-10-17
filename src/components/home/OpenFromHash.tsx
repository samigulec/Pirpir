"use client";

import { useEffect } from "react";

/** Adres #sss-bags gibi bir SSS sorusunu gösteriyorsa o soru açılır (ipucu kartlarından gelince). */
export function OpenFromHash() {
  useEffect(() => {
    const open = () => {
      const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
