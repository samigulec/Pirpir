import { ImageResponse } from "next/og";

const SIZE = 96;

/**
 * Havayolunun resmi logosu (Duffel'ın varlık sunucusundaki SVG) PDF'e konabilsin diye PNG'ye çevrilir.
 * Alınamazsa logo gösterilmez; yerine bir şey çizilmez.
 */
export async function logoPng(url?: string): Promise<string | undefined> {
  if (!url?.startsWith("https://assets.duffel.com/")) return undefined;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500), next: { revalidate: 86400 } });
    if (!res.ok) return undefined;
    const src = `data:image/svg+xml;base64,${Buffer.from(await res.text()).toString("base64")}`;
    // eslint-disable-next-line @next/next/no-img-element
    const png = new ImageResponse(<img src={src} width={SIZE} height={SIZE} alt="" />, { width: SIZE, height: SIZE });
    return `data:image/png;base64,${Buffer.from(await png.arrayBuffer()).toString("base64")}`;
  } catch {
    return undefined;
  }
}
