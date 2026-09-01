const crypto = require('crypto');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
const CURRENCY = (process.env.PAYPAL_CURRENCY || 'USD').toUpperCase();

function paypalBaseUrl() {
  return PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function assertServerConfig() {
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!PAYPAL_CLIENT_ID) missing.push('PAYPAL_CLIENT_ID');
  if (!PAYPAL_CLIENT_SECRET) missing.push('PAYPAL_CLIENT_SECRET');
  if (missing.length) {
    const err = new Error(`Missing server environment variables: ${missing.join(', ')}`);
    err.statusCode = 500;
    throw err;
  }
}

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function cleanSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  return slug;
}

function cents(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round((n + Number.EPSILON) * 100);
}

function money(valueInCents) {
  return (valueInCents / 100).toFixed(2);
}

async function supabase(path, options = {}) {
  assertServerConfig();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const raw = await response.text();
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = raw; }
  }

  if (!response.ok) {
    const err = new Error(`Supabase request failed (${response.status})`);
    err.statusCode = 500;
    err.details = data;
    throw err;
  }
  return data;
}

async function getTrustedProducts(items) {
  if (!Array.isArray(items) || !items.length) {
    const err = new Error('Your cart is empty.');
    err.statusCode = 400;
    throw err;
  }

  if (items.length > 20) {
    const err = new Error('Too many items in one checkout.');
    err.statusCode = 400;
    throw err;
  }

  const slugs = [];
  for (const item of items) {
    const slug = cleanSlug(item?.slug);
    if (!slug) {
      const err = new Error('Invalid product identifier.');
      err.statusCode = 400;
      throw err;
    }
    if (!slugs.includes(slug)) slugs.push(slug);
  }

  const filter = `(${slugs.join(',')})`;
  const query = new URLSearchParams({
    select: 'slug,name,price,category,active',
    slug: `in.${filter}`,
    active: 'eq.true'
  });

  const rows = await supabase(`products?${query.toString()}`, { method: 'GET' });
  const bySlug = new Map((rows || []).map(p => [p.slug, p]));

  if (bySlug.size !== slugs.length) {
    const missing = slugs.filter(s => !bySlug.has(s));
    const err = new Error(`One or more products are unavailable: ${missing.join(', ')}`);
    err.statusCode = 409;
    throw err;
  }

  return slugs.map(slug => {
    const product = bySlug.get(slug);
    const priceCents = cents(product.price);
    if (priceCents === null || priceCents <= 0) {
      const err = new Error(`Invalid server price for ${slug}.`);
      err.statusCode = 500;
      throw err;
    }
    return {
      slug: product.slug,
      name: String(product.name || product.slug).slice(0, 127),
      category: product.category,
      price: Number(product.price),
      priceCents
    };
  });
}

async function getPayPalAccessToken() {
  assertServerConfig();
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    const err = new Error('Unable to authenticate with PayPal.');
    err.statusCode = 502;
    err.details = data;
    throw err;
  }
  return data.access_token;
}

async function paypalRequest(path, options = {}) {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });
  const raw = await response.text();
  let data = {};
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = { raw }; }
  }
  return { response, data };
}

async function createPayPalOrder(products) {
  const totalCents = products.reduce((sum, p) => sum + p.priceCents, 0);
  const total = money(totalCents);
  const items = products.map(p => ({
    name: p.name,
    sku: p.slug,
    quantity: '1',
    category: 'DIGITAL_GOODS',
    unit_amount: { currency_code: CURRENCY, value: money(p.priceCents) }
  }));

  const { response, data } = await paypalRequest('/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'PayPal-Request-Id': crypto.randomUUID(),
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: 'KAIZEN_STORE',
        description: `Kaizen — ${products.map(p => p.name).join(', ')}`.slice(0, 127),
        amount: {
          currency_code: CURRENCY,
          value: total,
          breakdown: { item_total: { currency_code: CURRENCY, value: total } }
        },
        items
      }],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Kaizen Subliminals',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING'
          }
        }
      }
    })
  });

  if (!response.ok || !data.id) {
    const err = new Error('PayPal could not create the order.');
    err.statusCode = 502;
    err.details = data;
    throw err;
  }

  return { order: data, total, totalCents };
}

async function savePendingCheckout(paypalOrderId, products, total) {
  const body = {
    paypal_order_id: paypalOrderId,
    items: products.map(p => ({ slug: p.slug, name: p.name, price: p.price })),
    amount: Number(total),
    currency: CURRENCY,
    status: 'created',
    updated_at: new Date().toISOString()
  };

  await supabase('paypal_checkouts?on_conflict=paypal_order_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body)
  });
}

async function getPendingCheckout(orderId) {
  const query = new URLSearchParams({
    select: '*',
    paypal_order_id: `eq.${orderId}`,
    limit: '1'
  });
  const rows = await supabase(`paypal_checkouts?${query.toString()}`, { method: 'GET' });
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function capturePayPalOrder(orderId) {
  let result = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      'PayPal-Request-Id': crypto.randomUUID(),
      Prefer: 'return=representation'
    },
    body: '{}'
  });

  if (result.response.ok) return result.data;

  // If the customer refreshed/retried after a successful capture, retrieve the order
  // and treat an already-completed PayPal order idempotently.
  const statusResult = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET'
  });
  if (statusResult.response.ok && statusResult.data?.status === 'COMPLETED') {
    return statusResult.data;
  }

  const err = new Error('PayPal could not capture the order.');
  err.statusCode = 502;
  err.details = result.data;
  throw err;
}

function completedCapture(order) {
  const captures = (order.purchase_units || []).flatMap(unit => unit?.payments?.captures || []);
  return captures.find(c => c?.status === 'COMPLETED') || captures[0] || null;
}

function verifyCapturedOrder(order, pending) {
  if (!order || order.status !== 'COMPLETED') {
    const err = new Error('Payment is not completed.');
    err.statusCode = 409;
    throw err;
  }

  const capture = completedCapture(order);
  const amount = capture?.amount || order.purchase_units?.[0]?.amount;
  const paidCurrency = String(amount?.currency_code || '').toUpperCase();
  const paidCents = cents(amount?.value);
  const expectedCents = cents(pending.amount);

  if (paidCurrency !== String(pending.currency).toUpperCase() || paidCents !== expectedCents) {
    const err = new Error('Captured amount does not match the server checkout record.');
    err.statusCode = 409;
    throw err;
  }

  return capture;
}

async function persistCompletedOrder(order, pending, capture) {
  const email = order?.payer?.email_address || '';
  const captureId = capture?.id || '';
  const now = new Date().toISOString();

  await supabase(`paypal_checkouts?paypal_order_id=eq.${encodeURIComponent(pending.paypal_order_id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      status: 'paid',
      payer_email: email,
      capture_id: captureId,
      updated_at: now
    })
  });

  const orderRow = {
    paypal_order_id: pending.paypal_order_id,
    items: (pending.items || []).map(item => item.slug),
    amount: Number(pending.amount),
    currency: pending.currency,
    email,
    status: 'paid'
  };

  await supabase('orders?on_conflict=paypal_order_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(orderRow)
  });

  const entitlements = (pending.items || []).map(item => ({
    paypal_order_id: pending.paypal_order_id,
    product_slug: item.slug,
    email,
    created_at: now
  }));

  if (entitlements.length) {
    await supabase('purchase_entitlements?on_conflict=paypal_order_id,product_slug', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify(entitlements)
    });
  }
}

function publicError(err) {
  const status = Number(err?.statusCode) || 500;
  const safe = status >= 500 ? 'Checkout service error. Please try again.' : err.message;
  if (status >= 500) console.error(err.message, err.details || '');
  return { status, message: safe };
}

module.exports = {
  CURRENCY,
  sendJson,
  parseBody,
  getTrustedProducts,
  createPayPalOrder,
  savePendingCheckout,
  getPendingCheckout,
  capturePayPalOrder,
  verifyCapturedOrder,
  persistCompletedOrder,
  publicError
};
