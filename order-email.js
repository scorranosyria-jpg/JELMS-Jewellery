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

async function notifyPaidOrder(stripe, session) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_SENDER_EMAIL;
  const to = process.env.ORDER_NOTIFICATION_EMAIL || 'jelms.jewellery@outlook.com';
  if (!apiKey || !from) throw new Error('BREVO_API_KEY / BREVO_SENDER_EMAIL not configured');

  const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  if (items.has_more) throw new Error('Order contains too many line items');
  const customer = session.customer_details || {};
  const delivery = (session.collected_information && session.collected_information.shipping_details)
    || session.shipping_details || {};
  const itemSummary = (items.data || []).map(item =>
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

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'JELMS Jewellery', email: from },
      to: [{ email: to }],
      subject: 'Neue bezahlte JELMS Bestellung: ' + money(session.amount_total, session.currency),
      textContent: text
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Brevo returned HTTP ' + response.status);
}

module.exports = { notifyPaidOrder };
