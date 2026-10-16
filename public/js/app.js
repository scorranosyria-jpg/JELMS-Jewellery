// ============================================================
// app.js — JELMS JEWELLERY
// ============================================================
// Diese Datei musst du normalerweise NICHT anfassen. Sie enthält:
//   1) Warenkorb-Logik (localStorage, funktioniert seitenübergreifend)
//   2) Kopfzeile / Fusszeile / Warenkorb-Panel (werden auf jeder
//      Seite automatisch in die Platzhalter-Divs eingefügt)
//   3) Hilfsfunktionen zum Rendern von Produktkarten, Grids, Galerie
//   4) Seiten-Bootstrap: liest data-page vom <body> und ruft die
//      passende init...()-Funktion auf
//
// Alle Texte/Preise/Bilder kommen aus content.js (window.JELMS_CONTENT).
// ============================================================

(function () {
  'use strict';

  var CONTENT = window.JELMS_CONTENT;
  var CART_KEY = 'jelms_cart_v1';

  // ------------------------------------------------------------
  // Hilfsfunktionen
  // ------------------------------------------------------------
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatPrice(price, currency) {
    if (!Number.isFinite(price)) return "Price at checkout";
    try {
      return new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
      }).format(price);
    } catch (e) {
      return price.toFixed(2) + ' ' + currency;
    }
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function findProduct(slug) {
    return CONTENT.products.find(function (p) {
      return p.slug === slug;
    });
  }

  function findProductById(id) {
    return CONTENT.products.find(function (p) {
      return p.id === id;
    });
  }

  function findCategory(slug) {
    return CONTENT.categories.find(function (c) {
      return c.slug === slug;
    });
  }

  // ------------------------------------------------------------
  // Warenkorb (localStorage, seitenübergreifend)
  // ------------------------------------------------------------
  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {
      // localStorage nicht verfügbar (z. B. Privatmodus) — Warenkorb
      // funktioniert dann nur innerhalb der aktuellen Seite nicht weiter.
    }
    renderCartBadge();
    renderCartPanelContents();
  }

  function addToCart(productId, quantity) {
    quantity = quantity || 1;
    var items = getCart();
    var existing = items.find(function (line) {
      return line.productId === productId;
    });
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId: productId, quantity: quantity });
    }
    saveCart(items);
  }

  function removeFromCart(productId) {
    var items = getCart().filter(function (line) {
      return line.productId !== productId;
    });
    saveCart(items);
  }

  function updateQuantity(productId, quantity) {
    var items = getCart();
    if (quantity <= 0) {
      items = items.filter(function (line) {
        return line.productId !== productId;
      });
    } else {
      items = items.map(function (line) {
        return line.productId === productId ? { productId: productId, quantity: quantity } : line;
      });
    }
    saveCart(items);
  }

  function getCartLines() {
    return getCart()
      .map(function (line) {
        var product = findProductById(line.productId);
        return product ? { product: product, quantity: line.quantity } : null;
      })
      .filter(Boolean);
  }

  function getItemCount() {
    return getCart().reduce(function (sum, line) {
      return sum + line.quantity;
    }, 0);
  }

  function getSubtotal() {
    if (getCartLines().some(function (line) { return !Number.isFinite(line.product.price); })) return null;
    return getCartLines().reduce(function (sum, line) {
      return sum + line.product.price * line.quantity;
    }, 0);
  }

  // ------------------------------------------------------------
  // Kopfzeile (Logo, Menü, Warenkorb-Icon)
  // ------------------------------------------------------------
  function renderHeader() {
    var mount = $('#site-header');
    if (!mount) return;

    var brand = CONTENT.brand;
    // HIER EIGENES LOGO EINSETZEN — brand.logoImage in content.js setzen
    var logoHtml = brand.logoImage
      ? '<img class="logo-image" src="' + escapeHtml(brand.logoImage) + '" alt="' + escapeHtml(brand.name) + '">'
      : '<span class="logo-text">' + escapeHtml(brand.name) + '</span>';

    var menuHtml = CONTENT.navigation
      .map(function (item) {
        return '<a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + '</a>';
      })
      .join('');

    mount.innerHTML =
      '<header class="site-header">' +
      '<a href="index.html" aria-label="Zur Startseite">' + logoHtml + '</a>' +
      '<nav class="nav-menu" id="nav-menu">' + menuHtml + '</nav>' +
      '<div class="nav-right">' +
      '<button class="cart-icon-btn" id="cart-open-btn" aria-label="Warenkorb öffnen">' +
      cartIconSvg() +
      '<span class="cart-badge" id="cart-badge" hidden>0</span>' +
      '</button>' +
      '<button class="hamburger-btn" id="menu-toggle-btn" aria-label="Menü öffnen">&#9776;</button>' +
      '</div>' +
      '</header>';

    $('#cart-open-btn').addEventListener('click', openCartPanel);
    $('#menu-toggle-btn').addEventListener('click', function () {
      $('#nav-menu').classList.toggle('open');
    });
  }

  function cartIconSvg() {
    return (
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13L5.4 5M7 13l-1.5 4h11M9 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z" ' +
      'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  }

  function renderCartBadge() {
    var badge = $('#cart-badge');
    if (!badge) return;
    var count = getItemCount();
    if (count > 0) {
      badge.hidden = false;
      badge.textContent = String(count);
    } else {
      badge.hidden = true;
    }
  }

  // ------------------------------------------------------------
  // Fusszeile
  // ------------------------------------------------------------
  function renderFooter() {
    var mount = $('#site-footer');
    if (!mount) return;

    // Social Media Links (styled buttons)
    var socialLinks = CONTENT.footer.socialLinks
      .map(function (link) {
        return (
          '<a class="site-footer__social-link" href="' + escapeHtml(link.href) + '" ' +
          'target="_blank" rel="noreferrer" title="' + escapeHtml(link.label) + '">' +
          escapeHtml(link.label) +
          '</a>'
        );
      })
      .join('');

    mount.innerHTML =
      '<footer class="site-footer">' +
      '<div class="site-footer__content">' +
      '<div class="site-footer__social">' +
      socialLinks +
      '</div>' +
      '<div class="site-footer__copyright">' + escapeHtml(CONTENT.footer.copyrightText) + '</div>' +
      '</div>' +
      '</footer>';
  }

  // ------------------------------------------------------------
  // Warenkorb-Panel (Slide-in, von jeder Seite über das Icon erreichbar)
  // ------------------------------------------------------------
  function renderCartPanelShell() {
    if ($('#cart-backdrop')) return; // schon vorhanden
    var backdrop = document.createElement('div');
    backdrop.className = 'cart-backdrop';
    backdrop.id = 'cart-backdrop';

    var panel = document.createElement('aside');
    panel.className = 'cart-panel';
    panel.id = 'cart-panel';

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    backdrop.addEventListener('click', closeCartPanel);

    renderCartPanelContents();
  }

  function renderCartPanelContents() {
    var panel = $('#cart-panel');
    if (!panel) return;

    var lines = getCartLines();
    var cc = CONTENT.cartContent;

    var itemsHtml = lines.length
      ? lines.map(cartItemHtml).join('')
      : '<p class="cart-empty">' + escapeHtml(cc.emptyText) + '</p>';

    var footerHtml = '';
    if (lines.length) {
      var subtotal = getSubtotal();
      var currency = lines[0].product.currency;
      footerHtml =
        '<div class="cart-panel__footer">' +
        '<div class="cart-subtotal-row"><span>' + escapeHtml(cc.subtotalLabel) + '</span><span>' +
        formatPrice(subtotal, currency) +
        '</span></div>' +
        // Start hosted Stripe Checkout from the basket.
        '<a data-stripe-checkout class="btn btn-primary btn-full" href="' + escapeHtml(cc.checkoutHref) + '">' + escapeHtml(cc.checkoutLabel) + '</a>' +
        '</div>';
    }

    panel.innerHTML =
      '<div class="cart-panel__header">' +
      '<h2 class="cart-panel__title">' + escapeHtml(cc.title) + '</h2>' +
      '<button class="cart-panel__close" id="cart-close-btn" aria-label="Warenkorb schliessen">&times;</button>' +
      '</div>' +
      '<div class="cart-panel__items">' + itemsHtml + '</div>' +
      footerHtml;

    $('#cart-close-btn').addEventListener('click', closeCartPanel);
    wireCartItemControls(panel);
  }

  function cartItemHtml(line) {
    var p = line.product;
    return (
      '<div class="cart-item" data-product-id="' + escapeHtml(p.id) + '">' +
      '<img class="cart-item__thumb" src="' + escapeHtml(p.images[0]) + '" alt="' + escapeHtml(p.name) + '">' +
      '<div class="cart-item__info">' +
      '<span class="cart-item__name">' + escapeHtml(p.name) + '</span>' +
      '<span class="cart-item__price">' + formatPrice(p.price, p.currency) + '</span>' +
      '<div class="cart-item__qty-row">' +
      '<button class="cart-item__step" data-action="decrease" aria-label="Menge verringern">&minus;</button>' +
      '<span class="cart-item__qty-value">' + line.quantity + '</span>' +
      '<button class="cart-item__step" data-action="increase" aria-label="Menge erhöhen">+</button>' +
      '</div>' +
      '<button class="cart-item__remove" data-action="remove">Entfernen</button>' +
      '</div>' +
      '<span class="cart-item__total">' + formatPrice(Number.isFinite(p.price) ? p.price * line.quantity : null, p.currency) + '</span>' +
      '</div>'
    );
  }

  function wireCartItemControls(root) {
    root.querySelectorAll('.cart-item').forEach(function (row) {
      var productId = row.getAttribute('data-product-id');
      row.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var action = btn.getAttribute('data-action');
          var items = getCart();
          var line = items.find(function (l) {
            return l.productId === productId;
          });
          var currentQty = line ? line.quantity : 0;
          if (action === 'increase') updateQuantity(productId, currentQty + 1);
          else if (action === 'decrease') updateQuantity(productId, currentQty - 1);
          else if (action === 'remove') removeFromCart(productId);
        });
      });
    });
  }

  function openCartPanel() {
    renderCartPanelShell();
    $('#cart-backdrop').classList.add('open');
    $('#cart-panel').classList.add('open');
  }

  function closeCartPanel() {
    var backdrop = $('#cart-backdrop');
    var panel = $('#cart-panel');
    if (backdrop) backdrop.classList.remove('open');
    if (panel) panel.classList.remove('open');
  }

  // ------------------------------------------------------------
  // Produktkarte / Produktgrid
  // ------------------------------------------------------------
  function productCardHtml(product) {
    var detailHref = 'product.html?slug=' + encodeURIComponent(product.slug);
    return (
      '<div class="product-card">' +
      '<a class="product-card__image-link" href="' + detailHref + '">' +
      '<img class="product-card__image" src="' + escapeHtml(product.images[0]) + '" alt="' + escapeHtml(product.name) + '">' +
      '</a>' +
      '<div class="product-card__body">' +
      '<a class="product-card__name" href="' + detailHref + '">' + escapeHtml(product.name) + '</a>' +
      '<span class="product-card__price">' + formatPrice(product.price, product.currency) + '</span>' +
      '<button class="btn btn-primary" data-add-to-cart="' + escapeHtml(product.id) + '">' +
      escapeHtml(CONTENT.cartContent.addToCartLabel) +
      '</button>' +
      '</div>' +
      '</div>'
    );
  }

  function renderProductGrid(container, products, emptyText) {
    if (!container) return;
    if (!products.length) {
      container.innerHTML = '<p class="product-grid__empty">' + escapeHtml(emptyText || 'Keine Produkte gefunden.') + '</p>';
      return;
    }
    container.innerHTML = products.map(productCardHtml).join('');
    container.querySelectorAll('[data-add-to-cart]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addToCart(btn.getAttribute('data-add-to-cart'), 1);
      });
    });
  }

  // ------------------------------------------------------------
  // Seiten-Bootstrap
  // ------------------------------------------------------------
  function initHomePage() {
    var brand = CONTENT.brand;
    var hero = $('#hero');
    if (hero) {
      hero.style.backgroundImage =
        'linear-gradient(var(--color-overlay), var(--color-overlay)), url("' + brand.heroImage + '")';
      $('#hero-name').textContent = brand.name;
      $('#hero-claim').textContent = brand.claim;
    }
    $('#intro-text').textContent = brand.introText;

    var tiles = $('#category-tiles');
    if (tiles) {
      tiles.innerHTML = CONTENT.categories
        .map(function (cat) {
          return (
            '<a class="category-tile category-tile--' + escapeHtml(cat.slug) + '" href="' + escapeHtml(cat.page) + '" ' +
            'style="background-image: linear-gradient(rgba(0,0,0,0) 40%, var(--color-overlay)), url(&quot;' + escapeHtml(cat.heroImage) + '&quot;)">' +
            escapeHtml(cat.name) +
            '</a>'
          );
        })
        .join('');
    }
    renderEvent();
  }

  function initShopPage() {
    var grid = $('#shop-grid');
    var filterRow = $('#filter-row');
    var allLabel = CONTENT.shop.filterAllLabel;

    function renderFiltered(filter) {
      var filtered = filter === 'all' ? CONTENT.products : CONTENT.products.filter(function (p) {
        return p.category === filter;
      });
      renderProductGrid(grid, filtered);
      filterRow.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
      });
    }

    var buttons = [
      '<button class="filter-btn active" data-filter="all">' + escapeHtml(allLabel) + '</button>',
    ].concat(
      CONTENT.categories.map(function (cat) {
        return '<button class="filter-btn" data-filter="' + escapeHtml(cat.slug) + '">' + escapeHtml(cat.name) + '</button>';
      })
    );
    filterRow.innerHTML = buttons.join('');
    filterRow.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderFiltered(btn.getAttribute('data-filter'));
      });
    });

    renderFiltered('all');
  }

  function initCategoryPage(categorySlug) {
    var category = findCategory(categorySlug);
    if (!category) return;

    var heroEl = $('#category-hero');
    heroEl.style.backgroundImage =
      'linear-gradient(var(--color-overlay), var(--color-overlay)), url("' + category.heroImage + '")';
    heroEl.querySelector('.category-hero__title').textContent = category.name;
    heroEl.querySelector('.category-hero__intro').textContent = category.introText;

    var categoryProducts = CONTENT.products.filter(function (p) {
      return p.category === categorySlug;
    });
    renderProductGrid($('#category-grid'), categoryProducts);
  }

  function initProductPage() {
    var slug = getQueryParam('slug');
    var product = findProduct(slug);
    var wrapper = $('#product-detail');
    var notFound = $('#product-not-found');

    if (!product) {
      wrapper.hidden = true;
      notFound.hidden = false;
      return;
    }
    notFound.hidden = true;
    wrapper.hidden = false;

    var quantity = 1;

    function renderGallery() {
      var mainImg = $('#gallery-main-img');
      var thumbsEl = $('#gallery-thumbs');
      var images = product.images.length ? product.images : ['images/placeholder-images/placeholder-fallback.jpg'];
      var activeIndex = 0;

      function showImage(index) {
        activeIndex = index;
        mainImg.src = images[activeIndex];
        mainImg.alt = product.name;
        thumbsEl.querySelectorAll('.product-gallery__thumb').forEach(function (t, i) {
          t.classList.toggle('active', i === activeIndex);
        });
      }

      if (images.length > 1) {
        thumbsEl.innerHTML = images
          .map(function (img, i) {
            return '<button class="product-gallery__thumb' + (i === 0 ? ' active' : '') + '" data-index="' + i + '"><img src="' + escapeHtml(img) + '" alt=""></button>';
          })
          .join('');
        thumbsEl.querySelectorAll('.product-gallery__thumb').forEach(function (thumb) {
          thumb.addEventListener('click', function () {
            showImage(Number(thumb.getAttribute('data-index')));
          });
        });
      } else {
        thumbsEl.innerHTML = '';
      }
      showImage(0);
    }
    renderGallery();

    $('#detail-name').textContent = product.name;
    $('#detail-price').textContent = formatPrice(product.price, product.currency);
    $('#detail-description').textContent = product.description;
    $('#detail-material').innerHTML = '<strong>Material:</strong> ' + escapeHtml(product.material);

    var qtyValueEl = $('#detail-qty-value');
    $('#detail-qty-decrease').addEventListener('click', function () {
      quantity = Math.max(1, quantity - 1);
      qtyValueEl.textContent = String(quantity);
    });
    $('#detail-qty-increase').addEventListener('click', function () {
      quantity += 1;
      qtyValueEl.textContent = String(quantity);
    });
    $('#detail-add-to-cart').textContent = CONTENT.cartContent.addToCartLabel;
    $('#detail-add-to-cart').addEventListener('click', function () {
      addToCart(product.id, quantity);
    });

    var relatedProducts = CONTENT.products
      .filter(function (p) {
        return p.category === product.category && p.id !== product.id;
      })
      .slice(0, 4);
    var relatedSection = $('#related-products');
    if (relatedProducts.length) {
      relatedSection.hidden = false;
      $('#related-heading').textContent = CONTENT.shop.relatedProductsHeading;
      renderProductGrid($('#related-grid'), relatedProducts);
    } else {
      relatedSection.hidden = true;
    }
  }

  function initCartPage() {
    var lines = getCartLines();
    var cc = CONTENT.cartContent;
    var emptyEl = $('#cart-page-empty');
    var itemsEl = $('#cart-page-items');
    var summaryEl = $('#cart-page-summary');

    $('#cart-page-heading').textContent = cc.title;

    if (!lines.length) {
      emptyEl.hidden = false;
      itemsEl.hidden = true;
      summaryEl.hidden = true;
      $('#cart-page-empty-text').textContent = cc.emptyText;
      $('#cart-page-continue').textContent = cc.continueShoppingLabel;
      return;
    }

    emptyEl.hidden = true;
    itemsEl.hidden = false;
    summaryEl.hidden = false;

    itemsEl.innerHTML = lines.map(cartItemHtml).join('');
    wireCartItemControls(itemsEl);

    function renderSummary() {
      var freshLines = getCartLines();
      if (!freshLines.length) {
        // Warenkorb wurde gerade geleert -> Seite neu initialisieren
        initCartPage();
        return;
      }
      var subtotal = getSubtotal();
      $('#cart-page-subtotal-label').textContent = cc.subtotalLabel;
      $('#cart-page-subtotal-value').textContent = formatPrice(subtotal, freshLines[0].product.currency);
    }
    renderSummary();

    $('#cart-page-checkout').setAttribute('data-stripe-checkout', '');
    $('#cart-page-checkout').textContent = cc.checkoutLabel;
    $('#cart-page-checkout').setAttribute('href', cc.checkoutHref);

    // Wenn im Panel/auf dieser Seite Menge geändert wird, Summary aktualisieren
    itemsEl.addEventListener('click', function () {
      setTimeout(renderSummary, 0);
    });
  }

  function initAboutPage() {
    var about = CONTENT.about;
    $('#about-heading').textContent = about.heading;
    $('#about-body').textContent = about.bodyText;
    var img = $('#about-image');
    img.src = about.image;
    img.alt = about.heading;
  }

  function initContactPage() {
    var contact = CONTENT.contact;
    $('#contact-heading').textContent = contact.heading;
    $('#contact-intro').textContent = contact.introText;

    var form = $('#contact-form');
    var confirmation = $('#contact-confirmation');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var formData = new FormData(form);
      var subject = 'Message from the JELMS Jewellery website';
      var body =
        'Name: ' + formData.get('name') + '\n' +
        'Email: ' + formData.get('email') + '\n\n' +
        'Message:\n' + formData.get('message');
      window.location.href =
        'mailto:' + contact.email +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.textContent = contact.confirmationText;
    });

    // Render event preview
    renderEventPreview();
  }

  function renderEvent() {
    var mount = $('#event-section');
    if (!mount) return;
    var evt = CONTENT.event;
    if (!evt || !evt.enabled) return;

    mount.innerHTML =
      '<div class="container">' +
      '<h3 class="event-section__heading">' + escapeHtml(evt.heading) + '</h3>' +
      '<p class="event-section__description">' + escapeHtml(evt.description) + '</p>' +
      '<p class="event-section__date">' + escapeHtml(evt.date) + '</p>' +
      '<a class="btn btn-primary event-section__cta" href="' + escapeHtml(evt.ctaHref) + '">' +
      escapeHtml(evt.ctaLabel) +
      '</a>' +
      '</div>';
  }

  function renderEventPreview() {
    var mount = $('#event-preview-section');
    if (!mount) return;
    var contact = CONTENT.contact;
    var preview = contact.eventPreview;
    if (!preview) return;

    mount.innerHTML =
      '<div class="event-preview__content">' +
      '<h3 class="event-preview__heading">' + escapeHtml(preview.heading) + '</h3>' +
      '<p class="event-preview__text">' + escapeHtml(preview.text) + '</p>' +
      '</div>' +
      (preview.image
        ? '<div class="event-preview__image"><a class="event-preview__link" href="' + escapeHtml(preview.image) + '" target="_blank" rel="noreferrer"><img src="' + escapeHtml(preview.image) + '" alt="Steinhausen Christmasmarket poster"></a></div>'
        : '');
  }

  // ------------------------------------------------------------
  // Start
  // ------------------------------------------------------------
  // Delegation also covers the basket panel when it is re-rendered.
  var checkoutPending = false;
  document.addEventListener('click', async function (event) {
    var button = event.target.closest('[data-stripe-checkout]');
    if (!button) return;
    event.preventDefault();
    if (checkoutPending) return;
    if (location.protocol === 'file:') {
      alert('Please open the shop through its web address to use checkout.');
      return;
    }
    checkoutPending = true;
    var label = button.textContent;
    button.textContent = 'Opening secure checkout…';
    button.setAttribute('aria-disabled', 'true');
    try {
      var response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: getCart() })
      });
      var result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Checkout could not be started.');
      var url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') {
        throw new Error('Checkout returned an invalid payment link.');
      }
      window.location.assign(url.href);
    } catch (error) {
      alert(error instanceof SyntaxError || error instanceof TypeError
        ? 'Checkout is unavailable. Please try again later or contact us.' : error.message);
    } finally {
      checkoutPending = false;
      button.textContent = label;
      button.removeAttribute('aria-disabled');
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    renderFooter();
    renderCartPanelShell();
    renderCartBadge();

    var page = document.body.getAttribute('data-page');
    var category = document.body.getAttribute('data-category');

    if (page === 'home') initHomePage();
    else if (page === 'shop') initShopPage();
    else if (page === 'category') initCategoryPage(category);
    else if (page === 'product') initProductPage();
    else if (page === 'cart') initCartPage();
    else if (page === 'about') initAboutPage();
    else if (page === 'contact') initContactPage();
  });
})();
