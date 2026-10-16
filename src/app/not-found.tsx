// Dil öneki çözülemeyen istekler için (ör. /xx/...). Ayrıntılı sayfa [locale]/not-found.tsx.
export default function GlobalNotFound() {
  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 40 }}>
        <h1>404</h1>
        <a href="/">rotala</a>
      </body>
    </html>
  );
}
