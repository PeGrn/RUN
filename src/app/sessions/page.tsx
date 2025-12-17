import { getTrainingSessions } from '@/actions/training-sessions';
import { getUserEvents } from '@/actions/events'; // Assure-toi d'avoir cette fonction (voir point 2)
import { HistoryList } from '@/components/history/history-list';
import { History } from 'lucide-react';
import { isCoachOrAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { clerkClient } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  // Vérifier que l'utilisateur est coach ou admin
  const hasPermission = await isCoachOrAdmin();
  if (!hasPermission) {
    redirect('/planning');
  }

  // Récupérer les séances ET les événements en parallèle
  const [sessionsResult, eventsResult] = await Promise.all([
    getTrainingSessions(),
    getUserEvents()
  ]);

  const sessions = sessionsResult.success && sessionsResult.sessions ? sessionsResult.sessions : [];
  const events = eventsResult.success && eventsResult.events ? eventsResult.events : [];

  // Récupérer les IDs des créateurs uniques
  const creatorIds = new Set<string>();
  sessions.forEach((s) => s.createdBy && creatorIds.add(s.createdBy));
  events.forEach((e) => e.createdBy && creatorIds.add(e.createdBy));

  // Récupérer les informations des utilisateurs depuis Clerk
  const userMap = new Map<string, string>();
  if (creatorIds.size > 0) {
    try {
      const users = await (await clerkClient()).users.getUserList({
        userId: Array.from(creatorIds),
      });
      users.data.forEach((user) => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur inconnu';
        userMap.set(user.id, fullName);
      });
    } catch (error) {
      console.error('Error fetching users from Clerk:', error);
    }
  }

  // Enrichir les données avec les noms des créateurs
  const enrichedSessions = sessions.map((s) => ({
    ...s,
    createdByName: s.createdBy ? userMap.get(s.createdBy) : undefined,
  }));

  const enrichedEvents = events.map((e) => ({
    ...e,
    createdByName: e.createdBy ? userMap.get(e.createdBy) : undefined,
  }));

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">
                Historique Global
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
              Historique du Club
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
              Retrouvez toutes les séances d&apos;entraînement et les événements passés
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <HistoryList
            initialSessions={enrichedSessions}
            initialEvents={enrichedEvents}
        />
      </div>
    </>
  );
}