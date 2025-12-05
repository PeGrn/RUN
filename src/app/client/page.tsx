import { ClientCalendar } from '@/components/client/client-calendar';
import { CalendarDays } from 'lucide-react';

export default function ClientPage() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">
                Calendrier des Entraînements
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
              Mes Séances
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
              Consultez et téléchargez vos programmes d&apos;entraînement planifiés
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <ClientCalendar />
      </div>
    </>
  );
}
