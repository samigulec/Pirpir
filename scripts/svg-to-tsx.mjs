// assets/ içindeki SVG'leri React bileşenlerine çevirir. Çizimler değiştirilmez.
// Kullanım: npm run svg  (Pirpir, Bulut ve Valiz varyant destekli olduğu için src/components/characters altında elle yazılır.)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const jobs = [
  { dir: "cities", out: "src/components/cities", files: {
    istanbul: "Istanbul", "istanbul-hero": "IstanbulHero", antalya: "Antalya", roma: "Roma",
    barselona: "Barselona", londra: "Londra", paris: "Paris" } },
  { dir: "payment", out: "src/components/payment", files: {
    kart: "KartIcon", "banka-ideal": "BankaIdealIcon", "telefon-apple-pay": "TelefonApplePayIcon",
    "cuzdan-google-pay": "CuzdanGooglePayIcon" } },
  { dir: "characters", out: "src/components/characters", files: {
    pasi: "Pasi", biletcik: "Biletcik", gunes: "Gunes", marti: "Marti" } },
];

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

for (const job of jobs) {
  mkdirSync(join(root, job.out), { recursive: true });
  for (const [file, name] of Object.entries(job.files)) {
    let svg = readFileSync(join(root, "assets", job.dir, file + ".svg"), "utf8");
    svg = svg.replace(/<\?xml[^>]*\?>\s*/, "").trim();
    const open = svg.match(/<svg([^>]*)>/);
    const attrs = Object.fromEntries([...open[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    let body = svg.slice(open.index + open[0].length, svg.lastIndexOf("</svg>"));
    body = body
      .replace(/ ([a-z]+(?:-[a-z]+)+)=/g, (_, a) => " " + camel(a) + "=")
      .replace(/<(\w+)([^>]*)><\/\1>/g, "<$1$2 />")
      .split("\n").map((l) => l.trim()).filter(Boolean).map((l) => "      " + l).join("\n");
    const usesId = /id="([^"]+)"/.test(body);
    if (usesId) {
      const id = body.match(/id="([^"]+)"/)[1];
      body = body.replace(`id="${id}"`, "id={id}").replaceAll(`"url(#${id})"`, "{`url(#$" + "{id})`}");
    }
    const label = attrs["aria-label"];
    const par = attrs.preserveAspectRatio ? `\n      preserveAspectRatio="${attrs.preserveAspectRatio}"` : "";
    const a11y = label ? `\n      role="img"\n      aria-label="${label}"` : `\n      aria-hidden="true"`;
    const src = `// Kaynak: assets/${job.dir}/${file}.svg — npm run svg ile üretildi, elle düzenleme.
${usesId ? 'import { useId } from "react";\n' : ""}import type { SVGProps } from "react";

export function ${name}(props: SVGProps<SVGSVGElement>) {
${usesId ? "  const id = useId();\n" : ""}  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${attrs.viewBox}"${par}${a11y}
      {...props}
    >
${body}
    </svg>
  );
}
`;
    writeFileSync(join(root, job.out, name + ".tsx"), src);
  }
}
console.log("SVG bileşenleri üretildi.");
