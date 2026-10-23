'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');

test('sandbox checkout only allows card and TWINT, disables Link, uses test price', async () => {
  const originalEnv = { VERCEL_ENV: process.env.VERCEL_ENV, JELMS_SANDBOX_CHECKOUT: process.env.JELMS_SANDBOX_CHECKOUT };
  let server;
  const calls = [];
  try {
    process.env.VERCEL_ENV = 'preview';
    process.env.JELMS_SANDBOX_CHECKOUT = '1';
    const stripe = { checkout: { sessions: { create: async options => {
      calls.push(options);
      return { url: 'https://checkout.stripe.com/c/pay/cs_test_mock' };
    } } } };
    const app = createApp({ stripe, domain: 'http://localhost:3000' });
    server = await new Promise((resolve, reject) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
      s.on('error', reject);
    });
    const endpoint = 'http://127.0.0.1:' + server.address().port + '/api/create-checkout-session';
    const response = await fetch(endpoint, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({items:[{productId:'short-keychain',quantity:1}]})
    });
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].payment_method_types, ['card','twint']);
    assert.deepEqual(calls[0].wallet_options, {link:{display:'never'}});
    assert.equal(calls[0].line_items[0].price_data.unit_amount, 1000);
    assert.equal(calls[0].line_items[0].price_data.currency, 'chf');
    const noOthers = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({items:[{productId:'mint-frost-earrings',quantity:1}]})});
    assert.equal(noOthers.status, 400);
    assert.equal(calls.length, 1);
  } finally {
    await new Promise(resolve => server ? server.close(resolve) : resolve());
    for (const [k,v] of Object.entries(originalEnv)) {
      if(v === undefined) delete process.env[k]; else process.env[k]=v;
    }
  }
});
