import TrainingPageClient from "./training-page-client";
import { getUserMetadata } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const metadata = await getUserMetadata();

  return <TrainingPageClient userRole={metadata?.role || 'athlete'} />;
}
