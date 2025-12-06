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

// Fonction helper pour normaliser une date en format YYYY-MM-DD sans timezone
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function PlanningCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // États pour les dates marquées
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [eventDates, setEventDates] = useState<string[]>([]);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Données détaillées pour le Drawer
  const [sessionsForDate, setSessionsForDate] = useState<TrainingSession[]>([]);
  const [eventsForDate, setEventsForDate] = useState<Event[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);

  // Charger les dates (Séances + Événements) quand le mois change
  const loadPlanning = useCallback(async () => {
    setLoadingDates(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      // On utilise l'action unifiée
      const result = await getPlanningData(year, month);
      
      if (result.success) {
        setSessionDates(result.sessionDates || []);
        setEventDates(result.eventDates || []);
      }
    } catch (error) {
      console.error('Error loading planning dates:', error);
    } finally {
      setLoadingDates(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadPlanning();
  }, [loadPlanning]);

  // Gérer le clic sur une date
  const handleDateClick = useCallback(async (date: Date | undefined) => {
    if (!date) return;

    const dateStr = formatDateLocal(date);
    const hasSession = sessionDates.includes(dateStr);
    const hasEvent = eventDates.includes(dateStr);

    // Ne rien faire s'il n'y a rien sur cette date
    if (!hasSession && !hasEvent) {
      return;
    }

    // Retirer le focus sur mobile pour éviter le clavier virtuel ou zoom
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      (document.activeElement as HTMLElement)?.blur();
    }

    setSelectedDate(date);
    setLoading(true);

    try {
      // --- CORRECTION TYPE SCRIPT ---
      // On sépare bien les promesses pour que TS sache qui est qui.
      
      // 1. Promesse pour les SÉANCES
      const sessionPromise = hasSession 
        ? getSessionsByDate(dateStr) 
        : Promise.resolve({ success: true, sessions: [] as TrainingSession[] });

      // 2. Promesse pour les ÉVÉNEMENTS
      const eventPromise = hasEvent 
        ? getEventsByDate(dateStr) 
        : Promise.resolve({ success: true, events: [] as Event[] });

      // 3. Exécution parallèle avec typage strict du tuple de retour
      const [sessionResult, eventResult] = await Promise.all([sessionPromise, eventPromise]);

      // Maintenant TS sait que sessionResult a .sessions et eventResult a .events
      setSessionsForDate(sessionResult.sessions || []);
      setEventsForDate(eventResult.events || []);
      
      setDrawerOpen(true);
    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionDates, eventDates]);

  // Configuration des indicateurs visuels
  const modifiers = useMemo(() => ({
    hasSession: (date: Date) => sessionDates.includes(formatDateLocal(date)),
    hasEvent: (date: Date) => eventDates.includes(formatDateLocal(date)),
  }), [sessionDates, eventDates]);

  const modifiersClassNames = useMemo(() => ({
    // Point Bleu (Séance) : Centré en bas
    hasSession: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
    // Point Orange (Événement) : Coin haut droit
    hasEvent: 'relative before:absolute before:top-1 before:right-1 before:w-1.5 before:h-1.5 before:bg-orange-500 before:rounded-full',
  }), []);

  return (
    <div className="w-full sm:flex sm:justify-center">
      <Card className="p-2 sm:p-4 md:p-6 w-full sm:max-w-md border-0 sm:border shadow-none sm:shadow-sm rounded-none sm:rounded-lg">
        <div className="relative w-full">
          {loadingDates && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
              <div className="text-sm text-muted-foreground">Chargement...</div>
            </div>
          )}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateClick}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={fr}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="w-full"
            disabled={loading}
          />
        </div>
        
        {/* Légende rapide */}
        <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
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