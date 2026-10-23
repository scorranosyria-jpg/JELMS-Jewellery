// ============================================================
// content.js — ALLE TEXTE, PREISE UND BILDPFADE — JELMS JEWELLERY
// ============================================================
// Das ist die einzige Datei, in der du Texte, Preise und Bildpfade
// änderst. HTML/CSS/JS musst du dafür nicht anfassen.
//
// Bildpfade zeigen auf deine eigenen Produktbilder in
// /images/placeholder-images/. Ersetze einfach die Dateinamen,
// falls du andere Dateinamen verwendest.
//
// Start with npm start and open http://localhost:3000 for Stripe checkout.
// ============================================================

window.JELMS_CONTENT = {
  // ============================================================
  // MARKE / BRAND
  // ============================================================
  brand: {
    name: "JELMS Jewellery",
    // TODO: TEXT ERSETZEN — Markenclaim (z. B. „Handgefertigter Schmuck für besondere Momente")
    claim: "Handmade Jewellery",
    // TODO: TEXT ERSETZEN — kurzer Markenintro-Text für die Startseite
    introText:
      "Modern jewellery made to match your style. Gold, beaded details and a little sparkle for every moment. Wear Your Spark.",
    // TODO: LOGO ERSETZEN — leer lassen (null) für Text-Logo, oder Pfad zu deinem Logo eintragen
    logoImage: "images/Logo.png",
    // TODO: BILD ERSETZEN — Hero-Bild der Startseite
    heroImage: "images/Final pictures/Braclets/Model making.jpg",
  },

  // ============================================================
  // NAVIGATION
  // ============================================================
  navigation: [
    { label: "Home", href: "index.html" },
    { label: "Shop", href: "shop.html" },
    { label: "Bracelets", href: "bracelets.html" },
    { label: "Earrings", href: "earrings.html" },
    { label: "Keychains", href: "keychains.html" },
    { label: "About", href: "about.html" },
    { label: "Contact", href: "contact.html" },
  ],

  // ============================================================
  // KATEGORIEN
  // ============================================================
  categories: [
  {
    "slug": "bracelets",
    "name": "Bracelets",
    "page": "bracelets.html",
    "heroImage": "images/Final pictures/Braclets/Model Bracelet.jpg",
    "introText": "Find your next favourite bracelet."
  },
  {
    "slug": "earrings",
    "name": "Earrings",
    "page": "earrings.html",
    "heroImage": "images/Final pictures/Earrings/Model Earring.jpg",
    "introText": "A little sparkle for every season."
  },
  {
    "slug": "keychains",
    "name": "Keychains",
    "page": "keychains.html",
    "heroImage": "images/Final pictures/keychains/Model keychain.jpg",
    "introText": "Add a little charm to your keys or bag."
  }
],

  // ============================================================
  // PRODUKTE — BRACELETS
  // ============================================================
  // Replace each images path with your own photo.
  // Display prices supplied by you; keep them in sync with Stripe.
  products: [
  {
    "id": "ocean-breeze-bracelet-set",
    "slug": "ocean-breeze-bracelet-set",
    "name": "Ocean Breeze Bracelet Set - Summer Collection",
    "category": "bracelets",
    "price": 10,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Braclets/Summertime collection (3).jpg"
    ],
    "description": "Bring a fresh, ocean-inspired touch to your summer style with this coordinated bracelet set. Wear the pieces together or mix them with your everyday favourites."
  },
  {
    "id": "pink-breeze-bracelet-set",
    "slug": "pink-breeze-bracelet-set",
    "name": "Pink Breeze Bracelet Set - Summer Collection",
    "category": "bracelets",
    "price": 10,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Braclets/Summertime collection (2).jpg"
    ],
    "description": "Soft pink tones give this bracelet set a light, playful feel for sunny days. Style the pieces together for a coordinated look or wear them one at a time."
  },
  {
    "id": "sunset-charm-bracelet-set",
    "slug": "sunset-charm-bracelet-set",
    "name": "Sunset Charm Bracelet Set - Summer Collection",
    "category": "bracelets",
    "price": 10,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Braclets/Summertime collection.jpg"
    ],
    "description": "Warm sunset-inspired colours make this bracelet set an easy way to brighten your summer outfits. Wear the coordinated pieces together or let one add a subtle pop of colour."
  },
  {
    "id": "ivory-glow-bracelet-set",
    "slug": "ivory-glow-bracelet-set",
    "name": "Ivory Glow Bracelet Set - Pearly Collection",
    "category": "bracelets",
    "price": 10,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Braclets/Pearly collection (2).jpg"
    ],
    "description": "With its soft, pearly look, this bracelet set adds a gentle glow to both everyday and dressed-up outfits. Wear the pieces together for a polished, coordinated style."
  },
  {
    "id": "soft-glow-bracelet",
    "slug": "soft-glow-bracelet",
    "name": "Soft Glow Bracelet - Pearly Collection",
    "category": "bracelets",
    "price": 10,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Braclets/Pearly collection.jpg"
    ],
    "description": "A delicate, luminous accent from the Pearly Collection, made for adding a soft touch of shine to your day. Wear it alone or pair it with your favourite bracelets."
  },
  {
    "id": "mint-frost-earrings",
    "slug": "mint-frost-earrings",
    "name": "Mint Frost Earrings - Frosty Christmas Collection",
    "category": "earrings",
    "price": 22,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Earrings/Frosty christmas collection (3).png"
    ],
    "description": "Cool, winter-inspired tones bring a crisp festive accent to your look. These earrings add a subtle seasonal sparkle for celebrations and cosy days alike."
  },
  {
    "id": "winter-sky-earrings",
    "slug": "winter-sky-earrings",
    "name": "Winter Sky Earrings - Frosty Christmas Collection",
    "category": "earrings",
    "price": 22,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Earrings/Snowflake collection.png"
    ],
    "description": "Inspired by a clear winter sky, these earrings bring a bright, wintry touch to your outfit. Their seasonal style works beautifully for festive gatherings or everyday wear."
  },
  {
    "id": "icicle-cascade-earrings",
    "slug": "icicle-cascade-earrings",
    "name": "Icicle Cascade Earrings - Frosty Christmas Collection",
    "category": "earrings",
    "price": 22,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Earrings/Frosty christmas collection.png"
    ],
    "description": "Inspired by the delicate shape of falling icicles, these earrings add an elegant winter accent. Let them bring a little seasonal sparkle to special occasions and everyday outfits."
  },
  {
    "id": "twilight-frost-earrings",
    "slug": "twilight-frost-earrings",
    "name": "Twilight Frost Earrings - Frosty Christmas Collection",
    "category": "earrings",
    "price": 22,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Earrings/Frosty christmas collection (2).png"
    ],
    "description": "A cool, twilight-inspired look gives these earrings a distinctive touch for the winter season. Pair them with your favourite evening outfit or wear them to add a hint of festive charm."
  },
  {
    "id": "evergreen-glow-earrings",
    "slug": "evergreen-glow-earrings",
    "name": "Evergreen Glow Earrings - Christmas Tree Collection",
    "category": "earrings",
    "price": 22,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Earrings/Christmas tree collection.png"
    ],
    "description": "Bring a little evergreen charm to the festive season with these Christmas tree-inspired earrings. They make a cheerful finishing touch for celebrations and winter days."
  },
  {
    "id": "clementine-glow-earrings",
    "slug": "clementine-glow-earrings",
    "name": "Clementine Glow Earrings - Christmas Lights Collection",
    "category": "earrings",
    "price": 22,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Earrings/Christmas lights collection.png"
    ],
    "description": "Bright and cheerful, these earrings take their inspiration from the glow of Christmas lights. Add a festive pop of colour to your seasonal outfits."
  },
  {
    "id": "festive-flame-earrings",
    "slug": "festive-flame-earrings",
    "name": "Festive Flame Earrings - Christmas Lights Collection",
    "category": "earrings",
    "price": 22,
    "currency": "CHF",
    "images": [
      "images/Final pictures/Earrings/Christmas lights collection (2).png"
    ],
    "description": "Inspired by the warm glow of festive lights, these earrings bring a bold seasonal accent to your look. Wear them to brighten up celebrations or add colour to a winter outfit."
  },
  {
    "id": "short-keychain",
    "slug": "short-keychain",
    "name": "Short Keychain",
    "category": "keychains",
    "price": 10,
    "currency": "CHF",
    "images": [
      "images/Final pictures/keychains/Short keychain.png"
    ],
    "description": "Keep your keys easy to find with this compact keychain, or add a little charm to your everyday bag. Its shorter length makes it a simple, practical accessory to carry."
  },
  {
    "id": "long-keychain",
    "slug": "long-keychain",
    "name": "Long Keychain",
    "category": "keychains",
    "price": 12,
    "currency": "CHF",
    "images": [
      "images/Final pictures/keychains/Long keychain.png"
    ],
    "description": "Give your keys or bag a longer, eye-catching accent with this keychain. Its extended style is easy to spot and makes a charming everyday accessory."
  }
],

  // ============================================================
  // EVENT INFORMATION (ersetzt Newsletter)
  // ============================================================
  event: {
    enabled: true,
    // TODO: TEXT ERSETZEN — Event-Überschrift
    heading: "Stay tuned for the winter season",
    // TODO: TEXT ERSETZEN — Event-Beschreibung
    description:
      "Come visit us at different Christmasmarkets in Switzerland! Further information to follow",
    // TODO: DATUM ÄNDERN — Event-Datum
    date: "November & December 2026",
    // TODO: LINK ANPASSEN — Link zur Event-Anmeldung oder mehr Informationen
    ctaLabel: "More infos to the christmasmarkets of Zug",
    ctaHref: "https://www.zug-tourismus.ch/de/weihnachtsmaerkte/",
    // TODO: BILD ERSETZEN (optional)
    image: "",
  },

  // ============================================================
  // FOOTER — SOCIAL MEDIA
  // ============================================================
  footer: {
    // TODO: LINK ANPASSEN — echte Social-Media-URLs eintragen
    socialLinks: [
      {
        label: "Instagram",
        // TODO: Instagram-Link eintragen
        href: "https://www.instagram.com/jelmsjewellery",
      },

      {
        label: "TikTok",
        // TODO: TikTok-Link eintragen
        href: "https://www.tiktok.com/@jelms.jewellery",
      },
    ],
    // TODO: TEXT ERSETZEN — Copyright und Legal-Text
    copyrightText:
      "© " +
      new Date().getFullYear() +
      " JELMS Jewellery. Alle Rechte vorbehalten.",
  },

  // ============================================================
  // ÜBER UNS
  // ============================================================
  about: {
    // TODO: TEXT ERSETZEN — Überschrift
    heading: "From a school project to something real.",
    // TODO: TEXT ERSETZEN — Markengeschichte
    bodyText:
      "We are five students at KBZ Zug, and as part of a school project, we created our own small business called JELMS Jewellery. Together, we design and sell earrings, bracelets, and winter-themed keychains at Christmas markets.\n\nWe created our own logo, website, social media accounts, prices, collections, and packaging. Some of our products are handmade, while others complete our collection.\n\nWith JELMS Jewellery, we are learning about teamwork, marketing, sales, finance, planning, and how a small business is organised.",
    // TODO: BILD ERSETZEN
    image: "images/Logo.png",
  },

  // ============================================================
  // KONTAKT
  // ============================================================
  contact: {
    heading: "Get in touch",
    introText:
      "We would love to hear from you. Whether you have a question, need help with an order, or simply want to say hello, feel free to get in touch.",
    email: "jelms.jewellery@outlook.com",
    // TODO: TEXT ERSETZEN — Bestätigungstext nach Formular-Absenden
    confirmationText:
      "Thank you for your message! We will get back to you as soon as possible.",

    // ============================================================
    // KONTAKT — EVENT PREVIEW (neu)
    // ============================================================
    eventPreview: {
      // TODO: TEXT ERSETZEN — Event-Vorschau-Überschrift
      heading: "Christmasmarket in Steinhausen",
      // TODO: TEXT ERSETZEN — Event-Vorschau-Text
      text: "JELMS Jewellery will be attending the Christmasmarket in Steinhausen.",
      // TODO: BILD ERSETZEN
      image: "images/Final pictures/Jelms Jewellery Steinhausen Christmasmarket.png"
    },
  },

  // ============================================================
  // WARENKORB
  // ============================================================
  cartContent: {
    title: "Cart",
    // TODO: TEXT ERSETZEN — Text für leeren Warenkorb
    emptyText:
      "Your cart is still empty. Time to find your new favourite piece!",
    subtotalLabel: "Current amount ",
    checkoutLabel: "Checkout",
    continueShoppingLabel: "continue shopping",
    addToCartLabel: "Add to cart",
    // TODO: LINK ANPASSEN — später mit echtem Checkout-Anbieter verbinden
    checkoutHref: "#checkout",
  },

  // ============================================================
  // SHOP
  // ============================================================
  shop: {
    heading: "Shop",
    filterAllLabel: "All",
    relatedProductsHeading: "You could like this to ",
  },
};
