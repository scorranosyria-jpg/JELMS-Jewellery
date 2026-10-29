const express = require('express');
const Stripe = require('stripe');
const path = require('node:path');
const prices = require('./stripe-prices.json');
const { notifyPaidOrder } = require('./order-email');

// Server-only configuration. Never expose these secrets through browser JavaScript.
function createApp({
  stripe,
  domain = 'http://localhost:3000',
  webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
} = {}) {
  const app = express();
  const origin = new URL(domain).origin;
  // This is a test-only branch. A Vercel Preview is never allowed to run
  // real-money checkout, even if a live Stripe key was inherited from Vercel.
  const sandboxPreview = process.env.VERCEL_ENV === 'preview' &&
    process.env.JELMS_SANDBOX_CHECKOUT === '1';
  app.disable('x-powered-by');

  function logSuccessfulPayment(session) {
    // Don't put customer names or delivery addresses in server logs.
    console.log('Stripe payment completed:', session.id, session.amount_total, session.currency);
  }

  app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe || !webhookSecret) {
      return res.status(503).json({ error: 'Stripe webhook is not configured.' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        // Sandbox: Stripe signing secrets cannot contain whitespace.
        // Remove accidental pasted spaces or line breaks without skipping verification.
        typeof webhookSecret === 'string' ? webhookSecret.replace(/\s+/g, '') : webhookSecret
      );
    } catch (error) {
      console.error('Stripe webhook verification failed:', error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          if (session.payment_status === 'paid') {
            await notifyPaidOrder(stripe, session);
            logSuccessfulPayment(session);
          }
          break;
        }
        case 'checkout.session.async_payment_succeeded': {
          const session = event.data.object;
          await notifyPaidOrder(stripe, session);
          logSuccessfulPayment(session);
          break;
        }
        case 'checkout.session.async_payment_failed': {
          console.warn('Stripe asynchronous payment failed:', event.data.object.id);
          break;
        }
        default:
          console.log('Unhandled Stripe event:', event.type);
      }
    } catch (error) {
      console.error('Paid-order email failed:', error.message);
      // A 500 asks Stripe to retry; it never charges the customer again.
      return res.status(500).json({ error: 'Order notification failed.' });
    }

    res.status(200).json({ received: true });
  });

  // TEMPORARY sandbox-only diagnosis: query Brevo event statuses without
  // exposing API keys, email addresses, message bodies or customer data.
  if (sandboxPreview) {
    app.get('/__jelms-brevo-delivery-check', async (req, res) => {
      res.set('Cache-Control', 'no-store');
      const apiKey = process.env.BREVO_API_KEY;
      const email = process.env.ORDER_NOTIFICATION_EMAIL;
      if (!apiKey || !email) return res.status(503).json({ error: 'brevo_config_missing' });
      try {
        const query = new URLSearchParams({
          email,
          startDate: '2026-10-29',
          endDate: '2026-10-29',
          limit: '100',
          sort: 'desc'
        });
        const response = await fetch('https://api.brevo.com/v3/smtp/statistics/events?' + query, {
          headers: { 'api-key': apiKey, Accept: 'application/json' },
          signal: AbortSignal.timeout(9000)
        });
        if (!response.ok) return res.status(502).json({ brevoHttpStatus: response.status });
        const data = await response.json();
        const events = Array.isArray(data.events) ? data.events : [];
        // Only a date, canonical event type, and redacted rejection reason.
        const sanitized = events.map(e => ({
          date: String(e.date || '').slice(0, 30),
          event: String(e.event || '').replace(/[^a-zA-Z_]/g, '').slice(0, 35),
          reason: String(e.reason || '')
            .replace(/[^\s@]+@[^\s@]+/g, '[email-redacted]')
            .replace(/\+?\d[\d ()-]{7,}\d/g, '[number-redacted]')
            .replace(/[\r\n]+/g, ' ')
            .slice(0, 180)
        }));
        res.json({ date: '2026-10-29', count: sanitized.length, events: sanitized });
      } catch (_) {
        res.status(502).json({ error: 'brevo_query_failed' });
      }
    });
  }

  app.use(express.json({ limit: '16kb' }));

  app.post('/api/create-checkout-session', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (req.get('origin') && req.get('origin') !== origin) {
      return res.status(403).json({ error: 'Please start checkout from the shop.' });
    }
    const items = req.body && req.body.items;
    if (!Array.isArray(items) || !items.length || items.length > 100) {
      return res.status(400).json({ error: 'Please add items to your basket.' });
    }
    const seen = new Set();
    for (const item of items) {
      if (!item || typeof item.productId !== 'string' ||
          !Object.hasOwn(prices, item.productId) || seen.has(item.productId) ||
          !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        return res.status(400).json({ error: 'Your basket contains an invalid item or quantity (maximum 99 per item).' });
      }
      seen.add(item.productId);
    }
    if (!stripe || items.some(item => !/^price_[a-zA-Z0-9]+$/.test(prices[item.productId]))) {
      return res.status(503).json({ error: 'Online checkout is not available yet. Please contact us to order.' });
    }
    if (sandboxPreview && items.some(item => item.productId !== 'short-keychain')) {
      return res.status(400).json({ error: 'Sandbox test: please buy one Short Keychain only.' });
    }
    try {
      // Real prices remain server-side. The sandbox test deliberately uses
      // an inline TEST price, so no second catalogue of sandbox price IDs is needed.
      const lineItems = sandboxPreview
        ? items.map(item => ({
            price_data: {
              currency: 'chf',
              product_data: { name: 'JELMS Sandbox Test – Short Keychain' },
              unit_amount: 1000
            },
            quantity: item.quantity
          }))
        : items.map(item => ({ price: prices[item.productId], quantity: item.quantity }));
      const session = await stripe.checkout.sessions.create({
        // In the sandbox only, offer cards and TWINT. Avoid Klarna,
        // Amazon Pay and Stripe Link without affecting the live store.
        // Apple Pay is a card wallet controlled separately in Stripe Checkout settings.
        ...(sandboxPreview ? {
          payment_method_types: ['card', 'twint'],
          wallet_options: { link: { display: 'never' } }
        } : {}),
        "ui_mode": "hosted_page",
        "billing_address_collection": "auto",
        "phone_number_collection": {
          "enabled": true
        },
        "automatic_tax": {
          "enabled": false
        },
        "allow_promotion_codes": true,
        "submit_type": "auto",
        "shipping_address_collection": {
          "allowed_countries": [
            "AD",
            "AL",
            "AT",
            "AX",
            "BA",
            "BE",
            "BG",
            "BY",
            "CH",
            "CZ",
            "DE",
            "DK",
            "EE",
            "ES",
            "FI",
            "FO",
            "FR",
            "GB",
            "GG",
            "GI",
            "GR",
            "HR",
            "HU",
            "IE",
            "IM",
            "IS",
            "IT",
            "JE",
            "LI",
            "LT",
            "LU",
            "LV",
            "MC",
            "MD",
            "ME",
            "MK",
            "MT",
            "NL",
            "NO",
            "PL",
            "PT",
            "RO",
            "RS",
            "RU",
            "SE",
            "SI",
            "SJ",
            "SK",
            "SM",
            "UA",
            "VA"
          ]
        },
        "name_collection": {
          "individual": {
            "enabled": true
          }
        },
        "integration_identifier": "hosted_web_0001",
        "origin_context": "web",
        mode: 'payment',
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: origin,
        line_items: lineItems,
      });
      res.json({ url: session.url });
    } catch (error) {
      console.error('Stripe checkout failed:', error.type || 'Error', error.code || '');
      res.status(502).json({ error: 'We could not start checkout. Please try again later.' });
    }
  });

  app.get('/success', (req, res) => res.sendFile(path.join(__dirname, 'checkout-return.html')));
  // Serve only public website files. The key, price map and server source stay private.
  for (const folder of ['css', 'js', 'images']) {
    app.use('/' + folder, express.static(path.join(__dirname, 'public', folder), { dotfiles: 'deny' }));
  }
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  const pages = new Set(['index.html', 'shop.html', 'bracelets.html', 'earrings.html',
    'rings.html', 'keychains.html', 'product.html', 'cart.html', 'about.html', 'contact.html']);
  app.get('/:page', (req, res, next) => {
    if (!pages.has(req.params.page)) return next();
    res.sendFile(path.join(__dirname, req.params.page));
  });
  app.use((error, req, res, next) => {
    res.status(error.status === 413 ? 413 : 400).json({ error: 'Invalid request.' });
  });
  return app;
}

const isPreview = process.env.VERCEL_ENV === 'preview';
const sandboxEnabled = process.env.JELMS_SANDBOX_CHECKOUT === '1';
// The isolated test branch uses a separate sandbox-only secret key.
// Never read the production STRIPE_SECRET_KEY from Vercel Preview.
const key = isPreview ? process.env.STRIPE_SECRET_TEST_KEY : process.env.STRIPE_SECRET_KEY;
const isTestKey = Boolean(key && key.startsWith('sk_test_'));
// Fail closed: never let the Preview run with a live or missing Stripe key.
const stripe = key && !key.includes('...') &&
  (!isPreview || (sandboxEnabled && isTestKey)) ? new Stripe(key) : null;

const app = createApp({
  stripe,
  domain: isPreview && process.env.VERCEL_URL
    ? 'https://' + process.env.VERCEL_URL
    : process.env.DOMAIN
});

if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => {
    console.log('JELMS server started.');
  });
}

module.exports = app;
module.exports.createApp = createApp;
