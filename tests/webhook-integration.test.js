'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Stripe = require('stripe');
const { createApp } = require('../server');

// The test uses invented checkout data and a mocked Brevo HTTP response.
// It NEVER calls Stripe or Brevo over the network and never charges a card.
test('verified Stripe checkout triggers one merchant notification; invalid/pending do not', async () => {
  const envNames = ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'ORDER_NOTIFICATION_EMAIL'];
  const original = Object.fromEntries(envNames.map(k => [k, process.env[k]]));
  const nativeFetch = global.fetch;
  const emails = [];
  const secret = 'whsec_integration_test_only';
  const sdk = new Stripe('sk_test_for_mock_only');
  const stripe = {
    webhooks: sdk.webhooks,
    checkout: {
      sessions: {
        listLineItems: async sessionId => {
          assert.equal(sessionId, 'cs_test_fake_order');
          return {
            has_more: false,
            data: [{ description: 'JELMS Pearl Bracelet', quantity: 2, amount_total: 2000 }]
          };
        }
      }
    }
  };

  let server;
  try {
    process.env.BREVO_API_KEY = 'test_not_a_real_key';
    process.env.BREVO_SENDER_EMAIL = 'jelms.jewellery@outlook.com';
    process.env.ORDER_NOTIFICATION_EMAIL = 'jelms.jewellery@outlook.com';
    global.fetch = async (url, options) => {
      if (String(url) === 'https://api.brevo.com/v3/smtp/email') {
        emails.push(JSON.parse(options.body));
        return { ok: true, status: 201 };
      }
      return nativeFetch(url, options);
    };

    const app = createApp({ stripe, domain: 'http://localhost:3000', webhookSecret: '  ' + secret.slice(0, 8) + '\n ' + secret.slice(8) + '  ' });
    server = await new Promise((resolve, reject) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
      s.on('error', reject);
    });
    const url = 'http://127.0.0.1:' + server.address().port + '/stripe-webhook';

    const makeEvent = (id, paymentStatus = 'paid') => ({
      id,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          object: 'checkout.session',
          id: 'cs_test_fake_order',
          payment_status: paymentStatus,
          amount_total: 2000,
          currency: 'chf',
          customer_details: { name: 'Test Person', email: 'test@example.invalid' },
          collected_information: {
            shipping_details: { address: { line1: 'Example Street 1', city: 'Zug', postal_code: '6300', country: 'CH' } }
          }
        }
      }
    });
    async function post(event, valid = true) {
      const payload = JSON.stringify(event);
      const signature = valid
        ? sdk.webhooks.generateTestHeaderString({ payload, secret })
        : 't=1000000000,v1=invalid';
      return nativeFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signature },
        body: payload
      });
    }

    const success = await post(makeEvent('evt_test_paid'));
    assert.equal(success.status, 200);
    assert.equal(emails.length, 1);
    assert.equal(emails[0].to[0].email, 'jelms.jewellery@outlook.com');
    assert.match(emails[0].textContent, /JELMS Pearl Bracelet/);
    assert.match(emails[0].textContent, /Example Street 1/);
    assert.match(emails[0].textContent, /20\.00 CHF/);

    const pending = await post(makeEvent('evt_test_pending', 'unpaid'));
    assert.equal(pending.status, 200);
    assert.equal(emails.length, 1, 'no email for unpaid checkout');

    const invalid = await post(makeEvent('evt_test_invalid'), false);
    assert.equal(invalid.status, 400);
    assert.equal(emails.length, 1, 'no email for unverifiable webhook');
  } finally {
    global.fetch = nativeFetch;
    await new Promise(resolve => server ? server.close(resolve) : resolve());
    for (const key of envNames) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
});
