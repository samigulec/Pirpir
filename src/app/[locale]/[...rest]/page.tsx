import { notFound } from "next/navigation";

// Bilinmeyen adresler dile uygun 404 sayfasına düşsün.
export default function CatchAll() {
  notFound();
}
