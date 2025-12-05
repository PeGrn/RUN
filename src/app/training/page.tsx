import { getGarminAuth } from "@/actions/garmin";
import { Header } from "@/components/header";
import TrainingPageClient from "./training-page-client";

export default async function TrainingPage() {
  const auth = await getGarminAuth();

  return (
    <>
      <Header isAuthenticated={auth.isAuthenticated} />
      <TrainingPageClient />
    </>
  );
}
