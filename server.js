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
        webhookSecret
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
    try {
      // Product IDs and quantities come from the cart. Prices come ONLY from this server.
      const session = await stripe.checkout.sessions.create({
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
        line_items: items.map(item => ({ price: prices[item.productId], quantity: item.quantity })),
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

const key = process.env.STRIPE_SECRET_KEY;
const stripe = key && !key.includes('...') ? new Stripe(key) : null;

const app = createApp({
  stripe,
  domain: process.env.DOMAIN
});

if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => {
    console.log('JELMS server started.');
  });
}

module.exports = app;
module.exports.createApp = createApp;
