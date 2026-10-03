import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import AuthShell from "@/components/AuthShell";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/leaderboard");
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
