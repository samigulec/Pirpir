# Travelpayouts White Label Widget — Translation Issues Report (TR & NL)

Below is a ready-to-send support message for Travelpayouts (`support@travelpayouts.com` or Partner Dashboard → Support) regarding broken Turkish translations and untranslated English strings on Dutch pages in the Flights White Label Web Widget (`tpwgt.com/wl_web/main.js`, Widget ID `25161`, Marker `812756`).

---

## Subject
Flights White Label Web Widget (ID 25161): Turkish translation errors and missing Dutch localizations

## Message

Hello Travelpayouts Support Team,

We are using the Flights White Label Web Widget (`tpwgt.com/wl_web/main.js`, Widget ID: `25161`) on our multilingual site (`flypirpir.nl`) in Turkish (`TR`), Dutch (`NL`), English (`EN`), and German (`DE`).

We noticed several mistranslations in **Turkish (`tr`)** and untranslated English strings in **Dutch (`nl`)** that affect conversion and user trust. Could you please forward these corrections to your localization team?

### 1. Turkish (`language=tr`) — Broken / Unnatural Translations

| UI Location | Current Text (TR) | Correct Turkish | Notes |
|---|---|---|---|
| Card primary CTA button (desktop) | `Seçme bilet` | `Bileti seç` | "Seçme bilet" reads like "assorted ticket"; "Bileti seç" means "Select ticket". |
| Card primary CTA button (mobile) | `Seçme` | `Seç` | "Seçme" means "selection / don't pick"; imperative should be "Seç". |
| Mobile layover label on flight card | `1 konaklama`, `2 konaklama` | `1 aktarma`, `2 aktarma` | "Konaklama" means hotel stay/accommodation; flight stopover is "aktarma". |
| Search progress bar | `Sağlayıcılarda arama` | `Uçuşlar aranıyor` | Literal machine translation of "Searching at providers". |
| Sort filter header | `Göre sırala` | `Sırala` | Missing object before "göre". |
| FlightMatrix "Show" button | `Show` | `Göster` | Left in English. |
| Relaxed-filters notice (`ticketswidget.soft_tickets_notice`) | `No tickets matching your parameters. We removed some filters and found a few available options that may be of interest` | `Seçtiğiniz filtrelere uyan bilet bulunamadı. Bazı filtreleri kaldırıp yakın seçenekleri gösteriyoruz.` | Left in English. |

### 2. Dutch (`language=nl`) — Untranslated English Strings

| UI Location | Current Text (NL) | Correct Dutch |
|---|---|---|
| Card badge (single direct flight) | `The only direct flight` | `Enige directe vlucht` |
| Card badge (cheapest) | `Cheapest` | `Goedkoopst` |
| Card badge (cheapest with baggage) | `Cheapest with baggage` | `Goedkoopst met bagage` |
| Card badge (cheapest convenient layover) | `Cheapest with a convenient layover` | `Goedkoopst met korte overstap` |
| Card badge (optimal) | `Optimal` | `Beste keuze` |
| Card badge (may be of interest) | `May be of interest` | `Ook interessant` |
| Card baggage toggle label | `Baggage +€ 21` | `Bagage +€ 21` |
| "Show more" button | `Show more options` | `Meer opties tonen` |
| FlightMatrix "Show" button | `Show` | `Tonen` |
| Relaxed-filters notice (`ticketswidget.soft_tickets_notice`) | `No tickets matching your parameters. We removed some filters and found a few available options that may be of interest` | `Geen tickets gevonden voor je filters. We hebben enkele filters verwijderd om alternatieven te tonen.` |

### 3. Additional Observations (Optional Improvements)
- When `baggage: ["full_baggage"]` filter is enabled, the left-column filter prices (e.g. `Layovers`, `Airlines`) continue showing lowest prices *without* baggage, which looks inconsistent next to baggage-included flight cards.
- The nearby-dates price strip (`FlightMatrixDesktop`) shows cached 1-adult baggageless prices, which can differ from live search results (especially with baggage or 2+ passengers).

Thank you for your help!
