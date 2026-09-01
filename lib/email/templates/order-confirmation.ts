import "server-only";

export interface OrderConfirmationLineItem {
  productTitle: string;
  downloadUrl: string | null;
  note?: string;
}

export interface OrderConfirmationInput {
  orderId: string;
  totalCents: number;
  currency: string;
  items: OrderConfirmationLineItem[];
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

// Brand tokens mirrored from tailwind.config.ts — email clients don't load
// Tailwind, so these are hardcoded to stay in sync with the site palette.
const COLORS = {
  void: "#05080D",
  charcoal: "#0D1522",
  panel: "#101D2E",
  burgundy: "#123252",
  crimson: "#3AA9D6",
  gold: "#AEDCEA",
  bone: "#EAF3F7",
};

export function renderOrderConfirmationEmail({
  orderId,
  totalCents,
  currency,
  items,
}: OrderConfirmationInput): { subject: string; html: string } {
  const shortOrderId = orderId.slice(0, 8).toUpperCase();
  const subject = `Your Kaizen order #${shortOrderId} — download links inside`;

  const itemsHtml = items
    .map((item) => {
      if (item.downloadUrl) {
        return `
          <tr>
            <td style="padding:16px 0;border-bottom:1px solid rgba(243,239,230,0.1);">
              <p style="margin:0 0 8px 0;font-size:15px;color:${COLORS.bone};font-family:Georgia,serif;">${escapeHtml(item.productTitle)}</p>
              <a href="${item.downloadUrl}" style="display:inline-block;padding:10px 20px;background-color:${COLORS.gold};color:${COLORS.void};text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;font-weight:600;">Download</a>
            </td>
          </tr>`;
      }
      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid rgba(243,239,230,0.1);">
            <p style="margin:0 0 4px 0;font-size:15px;color:${COLORS.bone};font-family:Georgia,serif;">${escapeHtml(item.productTitle)}</p>
            <p style="margin:0;font-size:12px;color:rgba(243,239,230,0.5);font-family:Helvetica,Arial,sans-serif;">${escapeHtml(item.note ?? "We'll email your download link shortly.")}</p>
          </td>
        </tr>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:${COLORS.void};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.void};padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:${COLORS.charcoal};border:1px solid rgba(174,220,234,0.2);">
            <tr>
              <td style="padding:40px 40px 24px 40px;text-align:center;border-bottom:1px solid rgba(174,220,234,0.15);">
                <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${COLORS.gold};font-family:Helvetica,Arial,sans-serif;">Kaizen Subliminals</p>
                <h1 style="margin:16px 0 0 0;font-size:24px;color:${COLORS.bone};font-family:Georgia,serif;font-weight:400;">Your order is ready</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 8px 40px;">
                <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(243,239,230,0.4);font-family:Helvetica,Arial,sans-serif;">Order #${shortOrderId}</p>
                <p style="margin:0;font-size:20px;color:${COLORS.gold};font-family:Georgia,serif;">${formatPrice(totalCents, currency)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 8px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${itemsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px 40px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(243,239,230,0.5);font-family:Helvetica,Arial,sans-serif;">
                  Download links are single-use-limited and expire after a short window — if a link stops working, just reply to this email and we'll issue a fresh one. Thank you for your order.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:11px;color:rgba(243,239,230,0.3);font-family:Helvetica,Arial,sans-serif;">Kaizen Subliminals</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
