'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { notifyPaidOrder } = require('../order-email');

const session = {
  id: 'cs_test_example',
  amount_total: 3200,
  currency: 'chf',
  payment_status: 'paid',
  customer_details: { name: 'Test Customer', email: 'buyer@example.test', phone: '+4100000000' },
  collected_information: { shipping_details: { address: { line1: 'Testweg 10', postal_code: '6300', city: 'Zug', country: 'CH' } } }
};
const stripe = {
  checkout: { sessions: { listLineItems: async (id, options) => {
    assert.equal(id, session.id);
    assert.equal(options.limit, 100);
    return { data: [{ description: 'Pearl Bracelet', quantity: 2, amount_total: 2000 }, { description: 'Keychain', quantity: 1, amount_total: 1200 }], has_more: false };
  } } }
};

async function withMock(variables, response, callback) {
  const keys = ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'ORDER_NOTIFICATION_EMAIL', 'ORDER_NOTIFICATION_SENDER_EMAIL'];
  const originals = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const origFetch = global.fetch;
  const requests = [];
  try {
    for (const key of keys) {
      if (key in variables) process.env[key] = variables[key];
      else delete process.env[key];
    }
    global.fetch = async (url, opts) => { requests.push({ url, ...opts }); return response; };
    await callback(requests);
  } finally {
    global.fetch = origFetch;
    for (const key of keys) {
      if (originals[key] === undefined) delete process.env[key];
      else process.env[key] = originals[key];
    }
  }
}

const env = {
  BREVO_API_KEY: 'test-only-not-real',
  BREVO_SENDER_EMAIL: 'jelms.jewellery@outlook.com',
  ORDER_NOTIFICATION_EMAIL: 'jelms.jewellery@outlook.com'
};

test('prepares a correctly addressed order email with items and shipping information', async () => {
  await withMock(env, { ok: true, status: 201 }, async requests => {
    await notifyPaidOrder(stripe, session);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(requests[0].method, 'POST');
    const msg = JSON.parse(requests[0].body);
    assert.equal(msg.to[0].email, 'jelms.jewellery@outlook.com');
    assert.equal(msg.sender.email, 'jelms.jewellery@outlook.com');
    assert.match(msg.subject, /32\.00 CHF/);
    assert.match(msg.textContent, /2 x Pearl Bracelet/);
    assert.match(msg.textContent, /1 x Keychain/);
    assert.match(msg.textContent, /Testweg 10/);
    assert.match(msg.textContent, /buyer@example\.test/);
    assert.ok(!msg.textContent.includes(env.BREVO_API_KEY));
    const customer = JSON.parse(requests[1].body);
    assert.equal(customer.to[0].email, 'buyer@example.test');
    assert.equal(customer.sender.email, 'jelms.jewellery@outlook.com');
    assert.equal(customer.replyTo.email, 'jelms.jewellery@outlook.com');
    assert.match(customer.subject, /^\[TEST\] Your JELMS order is confirmed/);
    assert.match(customer.textContent, /Pearl Bracelet/);
    assert.match(customer.textContent, /Keychain/);
    assert.match(customer.textContent, /Testweg 10/);
    assert.match(customer.htmlContent, /images\/Logo\.png/);
    assert.match(customer.htmlContent, /WEAR YOUR SPARK/);
    assert.match(customer.htmlContent, /TEST ORDER ONLY/);
    assert.ok(!customer.htmlContent.includes(env.BREVO_API_KEY));
  });
});

test('uses a different verified sender only for merchant alerts when configured', async () => {
  await withMock({ ...env, ORDER_NOTIFICATION_SENDER_EMAIL: 'jelms-notifications@example.test' },
    { ok: true, status: 201 }, async requests => {
      await notifyPaidOrder(stripe, session);
      assert.equal(requests.length, 2);
      const merchant = JSON.parse(requests[0].body);
      const customer = JSON.parse(requests[1].body);
      assert.equal(merchant.sender.email, 'jelms-notifications@example.test');
      assert.equal(merchant.to[0].email, 'jelms.jewellery@outlook.com');
      assert.equal(customer.sender.email, 'jelms.jewellery@outlook.com');
      assert.equal(customer.replyTo.email, 'jelms.jewellery@outlook.com');
    });
});

test('does not send when the Brevo secret is absent', async () => {
  await withMock({ BREVO_SENDER_EMAIL: env.BREVO_SENDER_EMAIL }, { ok: true }, async requests => {
    await assert.rejects(notifyPaidOrder(stripe, session), /not configured/);
    assert.equal(requests.length, 0);
  });
});

test('fails on email provider error so Stripe webhook can retry', async () => {
  await withMock(env, { ok: false, status: 429 }, async requests => {
    await assert.rejects(notifyPaidOrder(stripe, session), /HTTP 429/);
    assert.equal(requests.length, 1);
  });
});

test('rejects truncated order item lists', async () => {
  const incomplete = { checkout: { sessions: { listLineItems: async () => ({ data: [], has_more: true }) } } };
  await withMock(env, { ok: true }, async requests => {
    await assert.rejects(notifyPaidOrder(incomplete, session), /too many line items/);
    assert.equal(requests.length, 0);
  });
});
