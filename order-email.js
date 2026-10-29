'use strict';

// Only use from the verified Stripe webhook, never from a public website route.
function formatAddress(address) {
  if (!address) return 'Nicht angegeben';
  return [
    address.line1, address.line2,
    [address.postal_code, address.city].filter(Boolean).join(' '),
    address.state, address.country
  ].filter(Boolean).join(', ') || 'Nicht angegeben';
}

function money(amount, currency) {
  return (Number(amount || 0) / 100).toFixed(2) + ' ' + (currency || 'CHF').toUpperCase();
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function validCustomerEmail(value) {
  if (typeof value !== 'string' || value.length > 254) return null;
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

async function sendBrevoEmail(apiKey, sender, message) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'JELMS Jewellery', email: sender },
      ...message
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Brevo returned HTTP ' + response.status);
}

function customerConfirmation({ session, items, customer, delivery, customerEmail, replyEmail }) {
  const isSandbox = session.livemode === false || String(session.id).startsWith('cs_test_');
  const orderReference = String(session.id || '');
  const displayName = String(customer.name || delivery.name || '').trim();
  const address = formatAddress(delivery.address || customer.address);
  const total = money(session.amount_total, session.currency);
  const entries = items.map(item => ({
    quantity: Number(item.quantity) || 1,
    description: String(item.description || 'Jewellery item'),
    total: money(item.amount_total, session.currency)
  }));
  const itemsText = entries.map(item => item.quantity + ' x ' + item.description + ' - ' + item.total);
  const testNotice = isSandbox
    ? 'TEST ORDER ONLY: No real payment was taken and nothing will be shipped.'
    : '';
  const plainText = [
    'JELMS Jewellery - Wear Your Spark',
    '',
    'Thank you for your order' + (displayName ? ', ' + displayName : '') + '!',
    'Your payment has been confirmed, and we have received your order.',
    testNotice,
    '',
    'Your order',
    ...itemsText,
    'Total paid: ' + total,
    'Order reference: ' + orderReference,
    address !== 'Nicht angegeben' ? 'Delivery address: ' + address : '',
    '',
    'We will get in touch if we need any further information.',
    'Questions? Contact us at ' + replyEmail + '.',
    '',
    'Thank you for supporting JELMS Jewellery!',
    'Wear Your Spark.'
  ].filter(Boolean).join('\n');
  const rows = entries.map(item =>
    '<tr><td style="padding:12px 8px;border-bottom:1px solid #eee3e4;color:#3d3d3d;">' +
    escapeHtml(item.quantity + ' x ' + item.description) +
    '</td><td style="padding:12px 8px;border-bottom:1px solid #eee3e4;text-align:right;white-space:nowrap;color:#3d3d3d;">' +
    escapeHtml(item.total) + '</td></tr>'
  ).join('');
  const html = [
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"></head>',
    '<body style="margin:0;padding:32px 12px;background:#F8ECE9;font-family:Arial,Helvetica,sans-serif;color:#3D3D3D;">',
    '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;max-width:580px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;">',
    '<tr><td style="padding:30px 28px;text-align:center;background:#F8ECE9;">',
    '<img src="https://jelms-jewellery.vercel.app/images/Logo.png" width="116" alt="JELMS Jewellery" style="max-width:116px;height:auto;display:block;margin:0 auto 8px;">',
    '<div style="font-size:12px;letter-spacing:2px;color:#6A4E6B;">WEAR YOUR SPARK</div>',
    '</td></tr><tr><td style="padding:28px;">',
    '<h1 style="font-family:Georgia,serif;font-size:29px;line-height:1.3;font-weight:normal;margin:0 0 16px;color:#614A63;">Thank you for your order!</h1>',
    '<p style="font-size:15px;line-height:1.8;margin:0 0 20px;">',
    'Hi' + (displayName ? ' ' + escapeHtml(displayName) : '') + ', your payment is confirmed and your order is with JELMS Jewellery.</p>',
    isSandbox ? '<p style="padding:12px 15px;border-radius:10px;background:#fff1d6;color:#704d22;font-size:13px;"><strong>TEST ORDER ONLY.</strong> No real payment was taken and nothing will be shipped.</p>' : '',
    '<div style="height:4px;background:linear-gradient(90deg,#F1C982,#CECAC8,#E6D5E9);border-radius:4px;margin:0 0 23px;"></div>',
    '<h2 style="font-size:17px;color:#614A63;margin:0 0 12px;">Your order</h2>',
    '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;font-size:14px;border-collapse:collapse;">',
    rows,
    '<tr><td style="padding:18px 8px 8px;font-size:16px;font-weight:bold;">Total paid</td>',
    '<td style="padding:18px 8px 8px;text-align:right;font-size:16px;font-weight:bold;">' + escapeHtml(total) + '</td></tr>',
    '</table>',
    address !== 'Nicht angegeben' ?
      '<p style="margin:20px 0 5px;color:#614A63;font-weight:bold;font-size:14px;">Delivery address</p>' +
      '<p style="margin:0;font-size:14px;line-height:1.6;">' + escapeHtml(address) + '</p>' : '',
    '<p style="margin:20px 0 0;font-size:12px;overflow-wrap:anywhere;color:#777;">Order reference: ' +
      escapeHtml(orderReference) + '</p>',
    '<p style="font-size:14px;line-height:1.8;margin:26px 0 10px;">Thank you for supporting our handmade jewellery. ' +
      'If you have a question, reply to this email and we will be happy to help.</p>',
    '<p style="font-family:Georgia,serif;font-size:20px;color:#A1748C;margin:16px 0 0;">Wear Your Spark &#10024;</p>',
    '</td></tr><tr><td style="padding:20px 28px;text-align:center;background:#E6D5E9;font-size:12px;">',
    'JELMS Jewellery &nbsp;&middot;&nbsp; ' + escapeHtml(replyEmail) +
    '</td></tr></table></body></html>'
  ].join('');
  return {
    to: [{ email: customerEmail }],
    replyTo: { email: replyEmail },
    subject: (isSandbox ? '[TEST] ' : '') + 'Your JELMS order is confirmed - ' + total,
    textContent: plainText,
    htmlContent: html
  };
}

// Called only after Stripe's signature and paid status have been verified.
// Both emails go through the same Brevo configuration; no new credentials are needed.
async function notifyPaidOrder(stripe, session) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_SENDER_EMAIL;
  const to = process.env.ORDER_NOTIFICATION_EMAIL || 'jelms.jewellery@outlook.com';
  if (!apiKey || !from) throw new Error('BREVO_API_KEY / BREVO_SENDER_EMAIL not configured');

  const response = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  if (response.has_more) throw new Error('Order contains too many line items');
  const items = response.data || [];
  const customer = session.customer_details || {};
  const delivery = (session.collected_information && session.collected_information.shipping_details)
    || session.shipping_details || {};
  const itemSummary = items.map(item =>
    String(item.quantity || 1) + ' x ' + (item.description || 'Schmuckstück') +
    ' — ' + money(item.amount_total, session.currency)
  ).join('\n');
  const text = [
    'Neue bezahlte JELMS Jewellery Bestellung',
    '',
    'Stripe-Bestellnummer: ' + session.id,
    'Gesamtpreis: ' + money(session.amount_total, session.currency),
    'Zahlungsstatus: ' + session.payment_status,
    '',
    'Produkte:',
    itemSummary || 'Keine Positionen',
    '',
    'Name: ' + (customer.name || delivery.name || 'Nicht angegeben'),
    'E-Mail: ' + (customer.email || session.customer_email || 'Nicht angegeben'),
    'Telefon: ' + (customer.phone || 'Nicht angegeben'),
    'Lieferadresse: ' + formatAddress(delivery.address || customer.address),
    '',
    'Vor dem Versand Zahlung im Stripe-Dashboard prüfen.'
  ].join('\n');

  // Internal order email always goes to JELMS, exactly as before.
  await sendBrevoEmail(apiKey, from, {
    to: [{ email: to }],
    subject: 'Neue bezahlte JELMS Bestellung: ' + money(session.amount_total, session.currency),
    textContent: text
  });

  const customerEmail = validCustomerEmail(customer.email) || validCustomerEmail(session.customer_email);
  if (!customerEmail) {
    console.warn('JELMS confirmation skipped: customer email missing or invalid');
    return { merchant: true, customer: false };
  }

  // If Brevo temporarily fails, the webhook returns an error so Stripe can retry.
  // Stripe may redeliver events; do not rely on this email as a fulfilment record.
  await sendBrevoEmail(apiKey, from, customerConfirmation({
    session, items, customer, delivery, customerEmail, replyEmail: to
  }));
  console.log('JELMS customer confirmation accepted by Brevo');
  return { merchant: true, customer: true };
}

module.exports = { notifyPaidOrder };
