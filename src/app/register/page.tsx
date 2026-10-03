import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/profile");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center bg-slate-50 px-4">
      <div className="w-full">
        <RegisterForm />
      </div>
    </main>
  );
}
