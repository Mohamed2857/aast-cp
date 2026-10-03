import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/profile");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center bg-slate-50 px-4">
      <div className="w-full">
        <LoginForm />
      </div>
    </main>
  );
}
