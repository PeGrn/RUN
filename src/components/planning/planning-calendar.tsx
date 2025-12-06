'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { getSessionDates, getSessionsByDate } from '@/actions/training-sessions';
import { SessionDrawer } from './session-drawer';
import { Card } from '@/components/ui/card';
import { fr } from 'date-fns/locale';
import type { TrainingSession } from '@prisma/client';

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
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionsForDate, setSessionsForDate] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);

  // Charger les dates avec des séances quand le mois change
  useEffect(() => {
    loadSessionDates();
  }, [currentMonth]);

  const loadSessionDates = async () => {
    setLoadingDates(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed

      const result = await getSessionDates(year, month);
      if (result.success && result.dates) {
        setSessionDates(result.dates);
      }
    } catch (error) {
      console.error('Error loading session dates:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  // Gérer le clic sur une date
  const handleDateClick = async (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);

    // Vérifier si cette date a des séances
    // Utiliser la timezone locale au lieu de UTC pour éviter les décalages
    const dateStr = formatDateLocal(date);

    if (!sessionDates.includes(dateStr)) {
      // Retirer le focus de l'élément actif sur mobile pour éviter le scroll indésirable
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        (document.activeElement as HTMLElement)?.blur();
      }
      return; // Pas de séances pour ce jour
    }

    // Charger les séances pour cette date
    setLoading(true);
    try {
      const result = await getSessionsByDate(dateStr);
      if (result.success && result.sessions) {
        setSessionsForDate(result.sessions);
        setDrawerOpen(true);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour personnaliser l'affichage des jours avec des dots
  const modifiers = {
    hasSession: (date: Date) => {
      const dateStr = formatDateLocal(date);
      return sessionDates.includes(dateStr);
    },
  };

  const modifiersClassNames = {
    hasSession: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
  };

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
      </Card>

      <SessionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        sessions={sessionsForDate}
        selectedDate={selectedDate}
        loading={loading}
      />
    </div>
  );
}
