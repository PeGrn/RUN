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

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
      <Card className="flex flex-col gap-4 h-fit p-2 sm:p-4 md:p-6 w-full sm:max-w-md border-0 sm:border shadow-none sm:shadow-sm rounded-none sm:rounded-lg overflow-hidden">
        
        <div className="relative w-full">
          {loadingDates && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
              <div className="text-sm text-muted-foreground">Chargement...</div>
            </div>
          )}
          
          <div className="p-1">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateClick}
              month={currentMonth}
              onMonthChange={handleMonthChange}
              locale={fr}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              disabled={loading}
              
              // --- CORRECTION ---
              // 1. On donne 'w-full' au composant lui-même pour qu'il prenne toute la largeur
              // 2. On surcharge SEULEMENT la variable CSS de taille pour agrandir les cases
              //    sans casser la structure flex interne du composant.
              //    2.5rem (40px) est la base, on peut mettre plus ou '100%' si géré.
              //    Ici, 'w-full' suffit souvent car votre composant Calendar a déjà flex-1 sur les jours.
              className="w-full touch-pan-y"
              
              // On supprime l'énorme bloc classNames={{...}} qui cassait le layout.
              // On garde juste un petit fix pour éviter le saut de focus sur le bouton du jour.
              classNames={{
                day: "h-9 w-9 sm:h-10 sm:w-10 p-0 font-normal aria-selected:opacity-100 focus:outline-none focus:ring-0 focus:ring-offset-0 flex-1 aspect-square",
                // On s'assure que les lignes prennent toute la largeur
                row: "flex w-full mt-2",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]",
              }}
            />
          </div>
        </div>
        
        <div className="mt-auto flex justify-center gap-6 text-xs text-muted-foreground">
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