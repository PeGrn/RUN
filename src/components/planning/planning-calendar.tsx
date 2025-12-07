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
import { cn } from '@/lib/utils';

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
    // Fix Mobile: Retire le focus pour éviter les sauts de viewport
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  const handleDateClick = useCallback(async (date: Date | undefined) => {
    if (!date) return;

    // Fix Mobile: Retire le focus du bouton cliqué
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      (document.activeElement as HTMLElement)?.blur();
    }

    const dateStr = formatDateLocal(date);
    const hasSession = sessionDates.includes(dateStr);
    const hasEvent = eventDates.includes(dateStr);

    setSelectedDate(date);

    // Si pas de données, on s'arrête là (juste sélection visuelle)
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
              className="w-full touch-pan-y"
              disabled={loading}
              
              // STYLES SURCHARGÉS POUR REMPLIR TOUTE LA CARTE
              classNames={{
                months: "w-full",
                month: "w-full space-y-4",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-full",
                day: cn(
                  "h-full w-full aspect-square p-0 font-normal aria-selected:opacity-100",
                  "focus:outline-none focus:ring-0 focus:ring-offset-0", // Fix layout shift on focus !
                  "hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                ),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
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