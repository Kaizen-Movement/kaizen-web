const {
  sendJson,
  parseBody,
  getTrustedProducts,
  createPayPalOrder,
  savePendingCheckout,
  publicError
} = require('./_lib');

module.exports = async function createOrder(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const body = parseBody(req);
    const products = await getTrustedProducts(body.items);
    const { order, total } = await createPayPalOrder(products);

    // The browser never supplies prices. This record stores the trusted server total
    // and the exact products used to create the PayPal order.
    await savePendingCheckout(order.id, products, total);

    return sendJson(res, 200, {
      id: order.id,
      status: order.status,
      currency: order.purchase_units?.[0]?.amount?.currency_code,
      total
    });
  } catch (err) {
    const safe = publicError(err);
    return sendJson(res, safe.status, { error: safe.message });
  }
};
