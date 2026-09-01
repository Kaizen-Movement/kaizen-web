import "server-only";

export interface AbandonedCheckoutItem {
  productTitle: string;
  slug: string;
}

const COLORS = {
  void: "#05080D",
  charcoal: "#0D1522",
  gold: "#AEDCEA",
  bone: "#EAF3F7",
};

export function renderCheckoutReminderEmail({
  items,
}: {
  items: AbandonedCheckoutItem[];
}): { subject: string; html: string } {
  const subject =
    items.length === 1
      ? `You left ${items[0].productTitle} in your cart`
      : "You left something in your cart";

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid rgba(243,239,230,0.1);">
            <p style="margin:0 0 8px 0;font-size:15px;color:${COLORS.bone};font-family:Georgia,serif;">${escapeHtml(item.productTitle)}</p>
            <a href="https://kaizensubliminals.store/products/${item.slug}" style="display:inline-block;padding:9px 18px;background-color:${COLORS.gold};color:${COLORS.void};text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;font-weight:600;">View Item</a>
          </td>
        </tr>`
    )
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
                <h1 style="margin:16px 0 0 0;font-size:22px;color:${COLORS.bone};font-family:Georgia,serif;font-weight:400;">Still thinking it over?</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${itemsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px 40px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(243,239,230,0.5);font-family:Helvetica,Arial,sans-serif;">
                  Your cart is still saved. Come back anytime to finish checking out.
                </p>
              </td>
            </tr>
          </table>
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
