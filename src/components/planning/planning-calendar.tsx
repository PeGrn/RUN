'use client';

import { useState, useEffect, useRef } from 'react';
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
  const calendarRef = useRef<HTMLDivElement>(null);

  // Empêcher le scroll automatique du navigateur mobile lors du clic sur une date
  useEffect(() => {
    let scrollPosition = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (calendarRef.current && calendarRef.current.contains(e.target as Node)) {
        // Sauvegarder la position de scroll actuelle
        scrollPosition = window.scrollY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (calendarRef.current && calendarRef.current.contains(e.target as Node)) {
        // Restaurer la position de scroll après un court délai
        // pour contrer le scroll automatique du navigateur
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'instant' as ScrollBehavior
          });
        });
      }
    };

    // Sur mobile uniquement
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

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

    // Vérifier si cette date a des séances AVANT de sélectionner
    // Utiliser la timezone locale au lieu de UTC pour éviter les décalages
    const dateStr = formatDateLocal(date);

    if (!sessionDates.includes(dateStr)) {
      // Ne pas sélectionner la date s'il n'y a pas de séance
      // Cela évite le changement d'état visuel qui cause le scroll sur mobile
      return;
    }

    // Retirer immédiatement le focus sur mobile pour éviter tout comportement indésirable
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      (document.activeElement as HTMLElement)?.blur();
    }

    // Ne sélectionner que les dates avec des séances
    setSelectedDate(date);

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
        <div
          ref={calendarRef}
          className="relative w-full"
          style={{
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
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
