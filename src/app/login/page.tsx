import { getGarminAuth } from "@/actions/garmin";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { Header } from "@/components/header";

export default async function LoginPage() {
  const auth = await getGarminAuth();

  if (auth.isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <>
      <Header isAuthenticated={false} />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-6 text-zinc-900 dark:text-zinc-50">
              Connexion Garmin Connect
            </h1>

            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
}
