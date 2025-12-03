import { redirect } from "next/navigation";
import { getGarminAuth } from "@/actions/garmin";

export default async function Home() {
  const auth = await getGarminAuth();

  if (auth.isAuthenticated) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
