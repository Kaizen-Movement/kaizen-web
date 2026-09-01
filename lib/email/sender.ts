import "server-only";
import nodemailer from "nodemailer";

// Sends via the owner's real Gmail account over SMTP, authenticated with a
// Gmail App Password (requires 2-Step Verification enabled on the account —
// Google Account -> Security -> 2-Step Verification -> App Passwords).
// This is genuinely "from" kaizenrequest01@gmail.com, not a spoofed header —
// Gmail's own servers are sending it because we're authenticated as the
// real mailbox owner, so there's no deliverability/DMARC problem the way
// there would be trying to send a gmail.com "from" address through a
// third-party service like Resend.
//
// Trade-off, worth remembering if volume grows: regular Gmail accounts cap
// outbound mail at roughly 500/day (Google Workspace accounts get more,
// ~2000/day). This is fine for a store doing a handful of orders a day:
// it is NOT fine at real scale, and sending transactional mail in bulk
// through a personal Gmail account risks Google flagging or suspending it.
// If daily order + reminder volume ever approaches ~50-100/day, it's time
// to move back to a real transactional provider (Resend, etc.) with a
// verified sending domain instead.

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  sent: boolean;
  error?: string;
}

/**
 * Best-effort email send. Deliberately never throws — a Gmail outage or
 * misconfiguration should never fail a checkout or block order fulfillment.
 * Callers should log the returned error for visibility but proceed regardless.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailInput): Promise<SendEmailResult> {
  const client = getTransporter();
  if (!client) {
    return { sent: false, error: "GMAIL_USER / GMAIL_APP_PASSWORD not configured." };
  }

  try {
    await client.sendMail({
      from: `Kaizen Subliminals <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Unknown email error.",
    };
  }
}
