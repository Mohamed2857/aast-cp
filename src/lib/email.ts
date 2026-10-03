import nodemailer from "nodemailer";

/**
 * Sends email. Picks the first provider that is configured:
 *   1. Gmail   : GMAIL_USER + GMAIL_APP_PASSWORD (free, reaches any address)
 *   2. Resend  : RESEND_API_KEY + EMAIL_FROM (needs a verified domain to reach other people)
 * With neither, development only prints the email in the terminal; production throws.
 */
export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }) {
  const gmailUser = process.env.GMAIL_USER;
  // Google shows app passwords in groups of 4 with spaces; the spaces are not part of it.
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  if (gmailUser && gmailPass) {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transport.sendMail({
      from: process.env.EMAIL_FROM || `ICPC AAST Aswan <${gmailUser}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("No email provider is set (GMAIL_USER / GMAIL_APP_PASSWORD or RESEND_API_KEY)");
  }
  console.log(`\n[email not configured] To: ${opts.to}\n${opts.subject}\n${opts.text}\n`);
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
