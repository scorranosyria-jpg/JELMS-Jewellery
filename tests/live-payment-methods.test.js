'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');

// Checkout request is handled by a fake Stripe client, so no live payment
// session is created and no card is charged during this test.
test('live checkout permits only card/TWINT, disables Link, keeps live prices', async () => {
  const calls = [];
  const stripe = { checkout: { sessions: { create: async opts => {
    calls.push(opts);
    return { url: 'https://checkout.stripe.com/mock' };
  } } } };
  const app = createApp({ stripe, domain: 'http://localhost:3000' });
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
    s.on('error', reject);
  });
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: 'short-keychain', quantity: 1 }] })
    });
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    const data = calls[0];
    assert.deepEqual(data.payment_method_types, ['card', 'twint']);
    assert.deepEqual(data.wallet_options, { link: { display: 'never' } });
    assert.equal(data.mode, 'payment');
    assert.equal(data.line_items.length, 1);
    assert.equal(data.line_items[0].price, require('../stripe-prices.json')['short-keychain']);
    assert.equal(data.line_items[0].quantity, 1);
    assert.equal(data.line_items[0].price_data, undefined);
    assert.equal(data.success_url, 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
