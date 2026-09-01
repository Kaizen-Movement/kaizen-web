import "server-only";

function getBaseUrl() {
  // Defaults to live since the project has live credentials configured.
  // Set PAYPAL_ENV=sandbox to test against sandbox instead.
  return process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error("PayPal credentials are not configured.");
  }

  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to get PayPal access token: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function createPayPalOrder(
  totalCents: number,
  currency: string,
  internalOrderId: string
): Promise<{ paypalOrderId: string }> {
  const token = await getAccessToken();
  const value = (totalCents / 100).toFixed(2);

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: internalOrderId,
          amount: { currency_code: currency, value },
        },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal order creation failed: ${text}`);
  }

  const data = await res.json();
  return { paypalOrderId: data.id };
}

export interface PayPalCaptureResult {
  status: string;
  captureId: string | null;
  payerEmail: string | null;
}

export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<PayPalCaptureResult> {
  const token = await getAccessToken();

  const res = await fetch(
    `${getBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`PayPal capture failed: ${JSON.stringify(data)}`);
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    status: data.status,
    captureId: capture?.id ?? null,
    payerEmail: data.payer?.email_address ?? null,
  };
}

/**
 * Verifies an incoming webhook is genuinely from PayPal using PayPal's own
 * verification API — never trust a webhook body just because it arrived.
 */
export async function verifyWebhookSignature(
  headers: {
    transmissionId: string;
    transmissionTime: string;
    certUrl: string;
    authAlgo: string;
    transmissionSig: string;
  },
  webhookId: string,
  eventBody: unknown
): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch(
    `${getBaseUrl()}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transmission_id: headers.transmissionId,
        transmission_time: headers.transmissionTime,
        cert_url: headers.certUrl,
        auth_algo: headers.authAlgo,
        transmission_sig: headers.transmissionSig,
        webhook_id: webhookId,
        webhook_event: eventBody,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) return false;

  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
