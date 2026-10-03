import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";
import { clientIp, isResetLimited, recordResetRequest } from "@/lib/rate-limit";
import { createResetToken } from "@/lib/password-reset";
import { escapeHtml, sendEmail } from "@/lib/email";

// Same answer whether or not the email exists, so nobody can use this to find out who has an account.
const OK = () => NextResponse.json({ ok: true });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  const { email } = parsed.data;
  const ip = clientIp(req);

  if (await isResetLimited(email, ip)) return OK();
  await recordResetRequest(email, ip);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, passwordHash: true },
  });
  if (!user || !user.passwordHash) return OK();

  try {
    const { token, minutes } = await createResetToken(user.id);
    // APP_URL is trusted; the request origin is only a fallback for local development.
    const base = (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, "");
    const link = `${base}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset your ICPC AAST Aswan password",
      text: `Hi ${user.name},\n\nUse this link to choose a new password (valid for ${minutes} minutes):\n${link}\n\nIf you did not ask for this, ignore this email. Your password stays the same.`,
      html: `<p>Hi ${escapeHtml(user.name)},</p>
<p>Use the button below to choose a new password. The link works for ${minutes} minutes.</p>
<p><a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
<p style="color:#64748b;font-size:13px">If you did not ask for this, ignore this email. Your password stays the same.</p>`,
    });
  } catch (e) {
    // Log it for the admin, but do not tell the visitor (it would reveal that the account exists).
    console.error("Could not send reset email:", e);
  }
  return OK();
}
