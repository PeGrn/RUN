import TrainingPageClient from "./training-page-client";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const user = await currentUser();

  // Récupérer la VMA et le rôle depuis les métadonnées
  const userVma = (user?.publicMetadata?.vma as number) || null;
  const userRole = (user?.publicMetadata?.role as string) || 'athlete';

  return <TrainingPageClient
    userRole={userRole as any}
    userVma={userVma}
  />;
}
