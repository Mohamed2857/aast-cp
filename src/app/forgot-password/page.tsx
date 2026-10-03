import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect("/leaderboard");
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
