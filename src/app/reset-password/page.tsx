import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { findValidToken } from "@/lib/password-reset";
import { buttonClass, cardClass } from "@/components/ui";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valid = token && token.length <= 200 ? await findValidToken(token) : null;

  return (
    <AuthShell>
      {valid && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className={`${cardClass} space-y-3 text-center`}>
          <p className="text-3xl">⏰</p>
          <h1 className="text-xl font-semibold">Link expired or invalid</h1>
          <p className="text-sm text-slate-600">
            Reset links work once and for one hour. Ask for a new one.
          </p>
          <Link href="/forgot-password" className={`${buttonClass} block`}>
            Get a new link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
