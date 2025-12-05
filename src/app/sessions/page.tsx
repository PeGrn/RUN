import { getTrainingSessions } from '@/actions/training-sessions';
import { SessionsList } from '@/components/sessions/sessions-list';
import { History, Sparkles } from 'lucide-react';

export default async function SessionsPage() {
  const { sessions } = await getTrainingSessions();

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b lg:sticky lg:top-0 lg:z-50">
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">
                Historique des Séances
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
              Mes Programmes VMA
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
              Retrouvez tous vos programmes d'entraînement sauvegardés
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <SessionsList sessions={sessions || []} />
      </div>
    </>
  );
}
