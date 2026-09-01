const {
  sendJson,
  parseBody,
  getPendingCheckout,
  capturePayPalOrder,
  verifyCapturedOrder,
  persistCompletedOrder,
  publicError
} = require('./_lib');

module.exports = async function captureOrder(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const body = parseBody(req);
    const orderID = String(body.orderID || '').trim();

    if (!/^[A-Z0-9-]{8,40}$/i.test(orderID)) {
      return sendJson(res, 400, { error: 'Invalid PayPal order ID.' });
    }

    const pending = await getPendingCheckout(orderID);
    if (!pending) {
      return sendJson(res, 404, { error: 'Checkout record not found.' });
    }

    // Idempotent response if our database already recorded this PayPal order.
    if (pending.status === 'paid') {
      return sendJson(res, 200, {
        ok: true,
        status: 'COMPLETED',
        orderID,
        items: (pending.items || []).map(item => item.slug)
      });
    }

    const paypalOrder = await capturePayPalOrder(orderID);
    const capture = verifyCapturedOrder(paypalOrder, pending);

    let recorded = true;
    try {
      await persistCompletedOrder(paypalOrder, pending, capture);
    } catch (persistError) {
      // PayPal is the payment source of truth. If persistence ever fails after a
      // confirmed capture, don't tell the buyer the payment failed. Log it so the
      // order can be reconciled from PayPal.
      recorded = false;
      console.error('Payment captured but Supabase persistence failed:', persistError);
    }

    return sendJson(res, 200, {
      ok: true,
      status: 'COMPLETED',
      orderID,
      recorded,
      items: (pending.items || []).map(item => item.slug)
    });
  } catch (err) {
    const safe = publicError(err);
    return sendJson(res, safe.status, { error: safe.message });
  }
};
