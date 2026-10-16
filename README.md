# Jelms Jewellery — HTML/CSS/JS-Version

## Stripe webhook

Configure a Stripe webhook endpoint at `https://your-domain/stripe-webhook` for
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, and
`checkout.session.async_payment_failed`. Set the endpoint's signing secret as
`STRIPE_WEBHOOK_SECRET` in the server environment and keep it private. For local
testing, use the Stripe CLI to forward those events to
`http://localhost:3000/stripe-webhook` and set the CLI-provided signing secret.
For Vercel production, set `DOMAIN` to `https://jelms-jewellery.vercel.app`.
The handler verifies Stripe's signature using the raw request body and logs
successful payment details, including customer contact and delivery information.
These details may contain personal data; the handler does not persist orders or
fulfill them.

Vollständiges, produktionsnahes Website-Gerüst für den Schmuck-Shop **Jelms Jewellery** — als reines HTML/CSS/JavaScript, ohne Build-Tool, ohne npm, ohne Framework. Öffne den Ordner einfach in Visual Studio Code.

## 1. Ordnerstruktur

```
jelms-jewellery-html/
├── index.html          Startseite
├── shop.html            Shop-Übersicht mit Kategorie-Filter
├── bracelets.html        Kategorieseite Bracelets
├── earrings.html          Kategorieseite Earrings
├── rings.html             Kategorieseite Rings
├── product.html           Produktdetailseite (?slug=... in der URL)
├── cart.html              Warenkorb als eigene Seite
├── about.html             Über uns
├── contact.html            Kontaktformular
├── css/
│   └── styles.css        FARBEN, SCHRIFTEN, alle Komponentenstile (zentral)
├── js/
│   ├── content.js         ALLE TEXTE, PREISE, BILDPFADE (zentral)
│   └── app.js             Warenkorb-Logik, Rendering, Seiten-Logik
└── images/
    └── placeholder-images/   Platzhalterbilder (ersetzbar)
```

## 2. In Visual Studio Code öffnen

1. Ordner in VS Code öffnen (Datei → Ordner öffnen…).
2. Empfehlung: Erweiterung **„Live Server"** installieren (Ritwick Dey) und auf `index.html` mit Rechtsklick → „Open with Live Server" starten. Damit funktionieren alle relativen Pfade und Verlinkungen zwischen den Seiten zuverlässig, und Änderungen werden beim Speichern automatisch neu geladen.
3. Alternative ohne Erweiterung: `index.html` direkt per Doppelklick im Browser öffnen. Funktioniert für die meisten Fälle auch ohne lokalen Server, da bewusst keine ES-Module und keine `fetch()`-Aufrufe verwendet werden (nur normale `<script>`-Tags).

Kein `npm install`, kein Build-Schritt — die Seiten funktionieren direkt.

## 3. Was du anfassen musst, um deine eigenen Inhalte einzusetzen

| Was ändern? | Wo? |
|---|---|
| **Logo** | `js/content.js` → `brand.logoImage` auf deinen Bildpfad setzen (z. B. `images/placeholder-images/logo.svg`), Bilddatei dort ablegen. Bleibt es leer, erscheint automatisch ein Text-Logo mit dem Markennamen. |
| **Produktbilder** | Datei am gleichen Pfad in `images/placeholder-images/` ersetzen (gleicher Dateiname), ODER in `js/content.js` bei `products[].images` einen neuen Pfad eintragen. |
| **Kategorie-/Hero-/About-Bilder** | Gleiches Prinzip: Datei ersetzen oder Pfad in `content.js` ändern (`brand.heroImage`, `categories[].heroImage`, `about.image`). |
| **Alle Texte** (Claim, Markengeschichte, Produktnamen, Beschreibungen, Material, Kontakttexte …) | `js/content.js` — jede Stelle ist mit `[Platzhaltertext]` und `// TODO: TEXT ERSETZEN` markiert. |
| **Preise** | `js/content.js` → `products[].price` (Zahl) und `products[].currency` (z. B. `"CHF"`). |
| **Farben** | `css/styles.css` → die `:root { ... }`-Variablen ganz oben (`--color-primary`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-text`, `--color-muted`). |
| **Schriften** | `css/styles.css` → `--font-heading`, `--font-accent`, `--font-body`. Passende Google-Font-Links stehen im `<head>` jeder HTML-Seite (bei Bedarf dort mit anpassen). |

Jede TODO-Markierung im Code sieht so aus:

```
// TODO: LOGO ERSETZEN
// TODO: PRODUKTBILD ERSETZEN
// TODO: TEXT ERSETZEN — Markenclaim
// TODO: FARBE ANPASSEN — styles.css
```

## 4. Wie die Seiten zusammenspielen

- **`content.js`** wird auf jeder Seite als erstes `<script>` geladen und legt alle Daten in `window.JELMS_CONTENT` ab.
- **`app.js`** wird danach geladen. Es fügt automatisch Kopfzeile, Fusszeile und das Warenkorb-Panel in die dafür vorgesehenen Platzhalter-Divs (`<div id="site-header"></div>` / `<div id="site-footer"></div>`) jeder Seite ein — du musst Navigation und Footer also nirgendwo von Hand pflegen.
- Welche Seite geladen ist, erkennt `app.js` am `data-page`-Attribut des `<body>`-Tags (z. B. `<body data-page="shop">`). Die Kategorieseiten tragen zusätzlich `data-category="bracelets"` (bzw. `earrings`/`rings`).
- Die Produktdetailseite liest den Produkt-Slug aus der URL (`product.html?slug=sandstone-bracelet`) — Links zu Produkten werden von den Produktkarten automatisch so gebaut.

## 5. Warenkorb-Funktionalität

- Der Warenkorb wird in `localStorage` gespeichert (Schlüssel `jelms_cart_v1`) — dadurch bleibt er beim Navigieren zwischen den Seiten erhalten, obwohl es sich um separate HTML-Seiten ohne Single-Page-Routing handelt.
- Hinzufügen, Menge ändern, Entfernen, automatische Zwischensumme.
- Artikelanzahl-Badge am Warenkorb-Icon in der Navigation, aktualisiert sich seitenübergreifend.
- Slide-in-Panel (von jeder Seite über das Warenkorb-Icon erreichbar) UND eine eigenständige `cart.html`-Seite stehen beide zur Verfügung — du kannst dich für eines von beiden entscheiden oder beides parallel lassen.
- **TODO:** „Zur Kasse" ist aktuell ein Platzhalter-Link (`cartContent.checkoutHref` in `content.js`). Später mit einem echten Checkout-Anbieter verbinden (z. B. Stripe Checkout, Shopify Buy Button) — dort die Artikel aus dem Warenkorb (auslesbar über `localStorage.getItem('jelms_cart_v1')`) an den jeweiligen Anbieter übergeben.

## 6. Kontaktformular & Newsletter

Beide sind aktuell rein optisch (kein Backend) — beim Absenden erscheint nur der Bestätigungstext aus `content.js`. Für echte Funktionalität später an einen Formular-Service (z. B. Formspree) bzw. Newsletter-Anbieter (z. B. Mailchimp, Klaviyo) anbinden — die entsprechenden `// TODO`-Kommentare in `js/app.js` markieren die Stellen (`initContactPage`, `initNewsletter`).
