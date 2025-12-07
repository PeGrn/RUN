'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { getPlanningData } from '@/actions/planning';
import { getSessionsByDate } from '@/actions/training-sessions';
import { getEventsByDate } from '@/actions/events';
import { SessionDrawer } from './session-drawer';
import { Card } from '@/components/ui/card';
import { fr } from 'date-fns/locale';
import type { TrainingSession, Event } from '@prisma/client';

// --- UTILITAIRES ---

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fonction pour calculer précisément le nombre de lignes (semaines) nécessaires
const getWeeksInMonth = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Premier jour du mois
  const firstDay = new Date(year, month, 1);
  // Dernier jour du mois
  const lastDay = new Date(year, month + 1, 0);
  
  // getDay() retourne 0 pour Dimanche, on veut 0 pour Lundi (fr)
  // Dimanche (0) -> 6, Lundi (1) -> 0, Mardi (2) -> 1...
  let firstDayIndex = firstDay.getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;
  
  const daysInMonth = lastDay.getDate();
  
  // Formule mathématique : (jours totaux + décalage du début) / 7 jours
  return Math.ceil((daysInMonth + firstDayIndex) / 7);
};

export function PlanningCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [eventDates, setEventDates] = useState<string[]>([]);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionsForDate, setSessionsForDate] = useState<TrainingSession[]>([]);
  const [eventsForDate, setEventsForDate] = useState<Event[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);

  // --- CALCUL DE HAUTEUR STABLE ---
  const calendarContainerHeight = useMemo(() => {
    const weeks = getWeeksInMonth(currentMonth);
    // Hauteur approximative :
    // - Header (Mois + Flèches) : ~60px
    // - Jours de la semaine (Lun, Mar...) : ~40px
    // - Lignes de jours (semaines) : ~48px par ligne (taille standard touch target)
    // - Padding interne : ~20px
    return 60 + 40 + (weeks * 48) + 20; 
  }, [currentMonth]);

  const loadPlanning = useCallback(async () => {
    setLoadingDates(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const result = await getPlanningData(year, month);
      
      if (result.success) {
        setSessionDates(result.sessionDates || []);
        setEventDates(result.eventDates || []);
      }
    } catch (error) {
      console.error('Error loading planning:', error);
    } finally {
      setLoadingDates(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadPlanning();
  }, [loadPlanning]);

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  const handleDateClick = useCallback(async (date: Date | undefined) => {
    if (!date) return;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      (document.activeElement as HTMLElement)?.blur();
    }

    const dateStr = formatDateLocal(date);
    const hasSession = sessionDates.includes(dateStr);
    const hasEvent = eventDates.includes(dateStr);

    setSelectedDate(date);

    if (!hasSession && !hasEvent) {
      return;
    }

    setLoading(true);

    try {
      const sessionPromise = hasSession 
        ? getSessionsByDate(dateStr) 
        : Promise.resolve({ success: true, sessions: [] as TrainingSession[] });

      const eventPromise = hasEvent 
        ? getEventsByDate(dateStr) 
        : Promise.resolve({ success: true, events: [] as Event[] });

      const [sessionResult, eventResult] = await Promise.all([sessionPromise, eventPromise]);

      setSessionsForDate(sessionResult.sessions || []);
      setEventsForDate(eventResult.events || []);
      
      setDrawerOpen(true);

    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionDates, eventDates]);

  const modifiers = useMemo(() => ({
    hasSession: (date: Date) => sessionDates.includes(formatDateLocal(date)),
    hasEvent: (date: Date) => eventDates.includes(formatDateLocal(date)),
  }), [sessionDates, eventDates]);

  const modifiersClassNames = useMemo(() => ({
    hasSession: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
    hasEvent: 'relative before:absolute before:top-1 before:right-1 before:w-1.5 before:h-1.5 before:bg-orange-500 before:rounded-full',
  }), []);

  return (
    <div className="w-full sm:flex sm:justify-center">
      <Card className="flex flex-col p-2 sm:p-4 md:p-6 w-full sm:max-w-md border-0 sm:border shadow-none sm:shadow-sm rounded-none sm:rounded-lg overflow-hidden transition-[height] duration-300 ease-in-out">
        
        {/* CONTAINER À HAUTEUR EXPLICITE 
           C'est ici que la magie opère : on force la hauteur avant le rendu du calendrier.
        */}
        <div 
          className="relative w-full transition-[height] duration-300 ease-in-out"
          style={{ height: `${calendarContainerHeight}px` }}
        >
          {loadingDates && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
              <div className="text-sm text-muted-foreground animate-pulse">Chargement...</div>
            </div>
          )}
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateClick}
            month={currentMonth}
            onMonthChange={handleMonthChange}
            locale={fr}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="w-full touch-pan-y block"
            disabled={loading}
            // On s'assure que le calendrier prend toute la place disponible
            classNames={{
              month: "w-full space-y-4",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            }}
          />
        </div>
        
        {/* Légende - Désormais stable car le bloc au-dessus a une hauteur fixe */}
        <div className="mt-4 pt-4 border-t flex justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Séance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Événement</span>
          </div>
        </div>
      </Card>

      <SessionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        sessions={sessionsForDate}
        events={eventsForDate}
        selectedDate={selectedDate}
        loading={loading}
      />
    </div>
  );
}