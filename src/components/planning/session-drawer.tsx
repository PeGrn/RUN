'use client';

import { useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronRight, Clock, Route, Flag, CalendarDays, Beer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUser } from '@clerk/nextjs';
import type { TrainingSession, Event } from '@prisma/client';
import type { TrainingElement } from '@/lib/vma';
import {
  ProgramSteps,
  formatTime,
  formatDistance,
  generateSessionSummary
} from '@/components/training/training-session-display';
import { AddToCalendarButton } from '@/components/events/add-to-calendar-button';
import { VmaDialog } from '@/components/settings/vma-dialog';
import { SessionActions } from '@/components/training/session-actions';

// --- HELPERS ---

/**
 * Combine une date et une heure (format "HH:mm") pour créer un Date object
 * Utilise les composants locaux (pas UTC) pour éviter les problèmes de fuseau horaire
 */
function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

/**
 * Vérifie quels KPIs dépendent de la VMA pour cette session
 * - Si la session a des étapes basées sur le temps → la distance dépend de la VMA
 * - Si la session a des étapes basées sur la distance → la durée dépend de la VMA
 */
function getSessionVmaDependencies(sessionSteps: TrainingElement[]): {
  distanceDependsOnVma: boolean;
  durationDependsOnVma: boolean;
} {
  if (!sessionSteps || sessionSteps.length === 0) {
    return { distanceDependsOnVma: false, durationDependsOnVma: false };
  }

  const hasTimeBasedSteps = sessionSteps.some(block =>
    block.steps.some(step => step.type === 'time')
  );

  const hasDistanceBasedSteps = sessionSteps.some(block =>
    block.steps.some(step => step.type !== 'time')
  );

  return {
    distanceDependsOnVma: hasTimeBasedSteps,
    durationDependsOnVma: hasDistanceBasedSteps,
  };
}

// --- SESSION DRAWER ---

interface SessionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: TrainingSession[];
  events?: Event[];
  selectedDate?: Date;
  loading?: boolean;
}

export function SessionDrawer({
  open,
  onOpenChange,
  sessions,
  events = [],
  selectedDate,
  loading = false,
}: SessionDrawerProps) {
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [vmaDialogOpen, setVmaDialogOpen] = useState(false);
  const { user } = useUser();

  // Récupérer la VMA de l'utilisateur
  const userVma = (user?.publicMetadata?.vma as number) || null;

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setSelectedSession(null);
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  // Vue : Chargement
  if (loading) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[50dvh] z-[200]">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // LOGIQUE D'AFFICHAGE
  const showList = !selectedSession && (sessions.length + events.length > 0);
  const isMultiView = sessions.length + events.length > 1 || events.length > 0;

  // --- VUE LISTE ---
  if (showList && isMultiView) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto z-[200]">
          <SheetHeader className="mb-4">
            <SheetTitle>
              {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </SheetTitle>
            <SheetDescription>
              {events.length > 0 ? `${events.length} événement(s) • ` : ''}
              {sessions.length} séance{sessions.length > 1 ? 's' : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* SECTION ÉVÉNEMENTS */}
            {events.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Événements</h3>
                {events.map((event) => (
                  <Card key={event.id} className="p-4 bg-orange-50/50 dark:bg-orange-950/10 border-orange-200/50">
                    <div className="flex gap-4">
                      <div className="shrink-0 mt-1">
                        {event.type === 'race' ? <Flag className="h-5 w-5 text-orange-600" /> :
                         event.type === 'gathering' ? <Beer className="h-5 w-5 text-amber-600" /> :
                         <CalendarDays className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                        {event.startTime && (
                          <p className="text-sm font-medium text-orange-600 mt-1">
                            {event.startTime}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {event.type === 'race' ? 'Compétition' :
                             event.type === 'gathering' ? 'Vie du club' : 'Autre'}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <AddToCalendarButton
                            event={{
                              title: event.title,
                              description: event.description || undefined,
                              startDate: event.startTime
                                ? combineDateAndTime(new Date(event.eventDate), event.startTime)
                                : new Date(event.eventDate),
                              useLocalTime: !!event.startTime,
                            }}
                            variant="outline"
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* SECTION SÉANCES */}
            {sessions.length > 0 && (
              <div className="space-y-3">
                {events.length > 0 && (
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Entraînements</h3>
                )}
                {sessions.map((session) => {
                  const sessionSteps = (session.steps as unknown as TrainingElement[]) || [];
                  const { distanceDependsOnVma, durationDependsOnVma } = getSessionVmaDependencies(sessionSteps);
                  const shouldBlurDistance = !userVma && distanceDependsOnVma;
                  const shouldBlurDuration = !userVma && durationDependsOnVma;
                  const shouldShowVmaPrompt = shouldBlurDistance || shouldBlurDuration;

                  return (
                    <div key={session.id} className="relative">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left flex items-center justify-between group"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{session.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className={`flex items-center gap-1 ${shouldBlurDistance ? 'blur-sm select-none' : ''}`}>
                              <Route className="h-4 w-4" />
                              {formatDistance(session.totalDistance)}
                            </span>
                            <span className={`flex items-center gap-1 ${shouldBlurDuration ? 'blur-sm select-none' : ''}`}>
                              <Clock className="h-4 w-4" />
                              {formatTime(session.totalTime)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </button>
                      {shouldShowVmaPrompt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVmaDialogOpen(true);
                          }}
                          className="absolute bottom-2 right-12 text-xs text-orange-600 hover:text-orange-700 hover:underline font-medium"
                        >
                          Configurer ma VMA
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // --- VUE DÉTAIL SÉANCE ---
  const session = selectedSession || (sessions.length === 1 ? sessions[0] : null);

  if (!session) {
    return null;
  }

  const sessionSteps = (session.steps as unknown as TrainingElement[]) || [];
  const { distanceDependsOnVma, durationDependsOnVma } = getSessionVmaDependencies(sessionSteps);
  const shouldBlurDistance = !userVma && distanceDependsOnVma;
  const shouldBlurDuration = !userVma && durationDependsOnVma;
  const shouldShowVmaPrompt = shouldBlurDistance || shouldBlurDuration;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] w-full z-[200] overflow-y-auto flex flex-col">
        
        {/* Header avec bouton retour */}
        <div className="mb-6 shrink-0">
            {isMultiView && (
                <button 
                    onClick={() => setSelectedSession(null)}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 -ml-1 py-2"
                >
                    <ChevronRight className="h-4 w-4 rotate-180" /> Retour au planning du jour
                </button>
            )}
            
            <div className="flex items-start justify-between gap-4">
                <div>
                    <SheetTitle className="text-2xl font-bold text-primary">
                        {session.name}
                    </SheetTitle>
                    <div className="mt-2 text-sm font-medium text-slate-600">
                        {generateSessionSummary(sessionSteps, userVma)}
                    </div>
                    <SheetDescription className="mt-1">
                        {selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                    </SheetDescription>
                </div>
                <div className="flex flex-col items-end gap-1 relative">
                    <Badge variant="secondary" className={`font-mono ${shouldBlurDistance ? 'blur-sm select-none' : ''}`}>
                        {formatDistance(session.totalDistance)}
                    </Badge>
                    <Badge variant="outline" className={`font-mono ${shouldBlurDuration ? 'blur-sm select-none' : ''}`}>
                        {formatTime(session.totalTime)}
                    </Badge>
                    {shouldShowVmaPrompt && (
                      <button
                        onClick={() => setVmaDialogOpen(true)}
                        className="absolute -bottom-6 right-0 text-xs text-orange-600 hover:text-orange-700 hover:underline font-medium whitespace-nowrap"
                      >
                        Configurer ma VMA
                      </button>
                    )}
                </div>
            </div>
        </div>

        {/* Contenu défilable */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {session.description && (
                <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm text-muted-foreground italic">
                        &quot;{session.description}&quot;
                    </p>
                </div>
            )}

            <div className="space-y-3 mb-8">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    Détail de la séance
                    {!userVma && (
                      <button
                        onClick={() => setVmaDialogOpen(true)}
                        className="ml-2 text-xs normal-case text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        (Configurez votre VMA pour voir les allures)
                      </button>
                    )}
                </h3>

                {/* INTÉGRATION DE ProgramSteps */}
                <ProgramSteps
                  elements={sessionSteps}
                  userVma={userVma}
                  sessionName={session.name}
                  sessionDate={selectedDate}
                />

            </div>
        </div>

        {/* Footer Actions (Sticky) */}
        <div className="pt-4 mt-auto border-t bg-background sticky bottom-0 z-10 shrink-0">
            <SessionActions
              sessionId={session.id}
              sessionName={session.name}
              sessionDate={selectedDate}
              variant="default"
            />
        </div>
      </SheetContent>
      <VmaDialog
        open={vmaDialogOpen}
        onOpenChange={setVmaDialogOpen}
        currentVma={userVma || undefined}
      />
    </Sheet>
  );
}