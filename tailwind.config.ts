import type { Config } from "tailwindcss";

// Tasarım tokenları — CLAUDE.md "Tasarım tokenları" tablosu
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E2A44",
        muted: "#56607A",
        primary: { DEFAULT: "#2F5BD3", dark: "#1E3F9E" },
        sky: "#EAF3FF",
        field: "#F5F8FD",
        line: "#E3E8F2",
        sun: { DEFAULT: "#FFD166", soft: "#FFF4D6", softer: "#FFF1C9", deep: "#FFB020", text: "#8A5A00" },
        coral: { DEFAULT: "#FF8A65", soft: "#FFE8E0", text: "#A3402A" },
        cheek: "#FFB4A2",
        "blue-soft": { DEFAULT: "#9CC3FF", light: "#CFE0FF" },
        plum: { DEFAULT: "#B5446E", text: "#8E2F55" },
        green: { DEFAULT: "#4CAF7A", text: "#2E7A4D", soft: "#E4F4EA", light: "#8FE3B0" },
        "pink-soft": "#F6E6EE",
        "ink-soft": "#3A4766",
        "on-ink": "#C9D3E6",
      },
      fontFamily: {
        display: ["var(--font-fredoka)", "var(--font-baloo)", "sans-serif"],
        body: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "999px",
      },
      boxShadow: {
        search: "0 18px 48px rgba(47,91,211,0.14)",
        float: "0 14px 36px rgba(30,42,68,0.16)",
        "float-strong": "0 14px 36px rgba(30,42,68,0.2)",
      },
      // İçerik genişliği + 2×24px yatay boşluk (tasarım content-box, Tailwind border-box kullanıyor).
      maxWidth: {
        page: "1168px",
        results: "928px",
        form: "768px",
        faq: "868px",
      },
      // Tasarımda yazı boyutları satır yüksekliğini değiştirmez; üst öğeden miras alınır.
      fontSize: {
        xs: ["12px", { lineHeight: "inherit" }],
        sm: ["14px", { lineHeight: "inherit" }],
        base: ["16px", { lineHeight: "inherit" }],
        lg: ["18px", { lineHeight: "inherit" }],
        xl: ["20px", { lineHeight: "inherit" }],
        "2xl": ["24px", { lineHeight: "inherit" }],
      },
    },
  },
  plugins: [],
};

export default config;
