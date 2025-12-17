'use client';

import { useState, useMemo, useEffect, forwardRef, useRef } from 'react';
import Link from "next/link";
import {
  CalendarDays,
  ArrowRight,
  Dumbbell,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  Route,
  Activity,
  BarChart3,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TrainingSession, Event } from "@prisma/client";
import type { TrainingElement } from "@/lib/vma";
import { calculateVMAProgram, convertBuilderElementsToSteps } from "@/lib/vma";
import { SpeedChart } from "@/components/training/charts/speed-chart";
import { VmaDialog } from '@/components/settings/vma-dialog';
import {
  ProgramSteps,
  formatTime,
  formatDistance
} from '@/components/training/training-session-display';
import { AddToCalendarButton } from '@/components/events/add-to-calendar-button';
import { useAthleteOnboarding } from '@/hooks/use-athlete-onboarding';
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

interface WeekData {
  sessions: TrainingSession[];
  events: Event[];
  weekStart: Date;
  weekEnd: Date;
}

interface HomeContentProps {
  userId: string | null;
  firstName: string;
  userVma: number | null;
  userRole: string;
  userStatus: string;
  currentWeek: WeekData;
  nextWeek: WeekData;
}

// --- SESSION CARD ---

const SessionCard = forwardRef<HTMLDivElement, { session: TrainingSession, userVma: number | null, defaultExpanded?: boolean }>(
  function SessionCard({ session, userVma, defaultExpanded = false }, ref) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const sessionSteps = (session.steps as unknown as TrainingElement[]) || [];

  const program = useMemo(() => {
    if (!sessionSteps.length) return null;
    const steps = convertBuilderElementsToSteps(sessionSteps);
    const calcVma = userVma || (session as any).vma || 15;
    return calculateVMAProgram(steps, calcVma);
  }, [sessionSteps, userVma, session]);

  const { distanceDependsOnVma, durationDependsOnVma } = getSessionVmaDependencies(sessionSteps);
  const shouldBlurDistance = !userVma && distanceDependsOnVma;
  const shouldBlurDuration = !userVma && durationDependsOnVma;

  return (
    <Card ref={ref} className="hover:shadow-md transition-shadow overflow-hidden bg-slate-50/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <CardHeader className="bg-white">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-1 flex items-center gap-2">
                {session.name}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <CalendarDays className="h-3 w-3" />
                {session.sessionDate && format(new Date(session.sessionDate), "EEEE d MMMM", { locale: fr })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </button>

      {isExpanded && (
        <CardContent className="border-t pt-6 pb-6 px-4 sm:px-6">
          {session.description && (
            <div className="mb-6 p-3 bg-white rounded-md border text-sm text-muted-foreground italic">
              &quot;{session.description}&quot;
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className={`p-3 rounded-lg bg-white border shadow-sm ${shouldBlurDistance ? 'relative' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                <Route className="h-3 w-3" />
                Distance
              </div>
              <div className={`text-xl font-bold text-slate-900 ${shouldBlurDistance ? 'blur-sm select-none' : ''}`}>
                {formatDistance(program?.totalDistance || session.totalDistance)}
              </div>
              {shouldBlurDistance && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-orange-600 font-medium">VMA requise</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg bg-white border shadow-sm ${shouldBlurDuration ? 'relative' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                <Clock className="h-3 w-3" />
                Durée
              </div>
              <div className={`text-xl font-bold text-slate-900 ${shouldBlurDuration ? 'blur-sm select-none' : ''}`}>
                {formatTime(program?.totalTime || session.totalTime)}
              </div>
              {shouldBlurDuration && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-orange-600 font-medium">VMA requise</span>
                </div>
              )}
            </div>
          </div>

          {sessionSteps.length > 0 && (
            <>
              {/* Mobile: Détail uniquement (pas de tabs) */}
              <div className="md:hidden">
                {!userVma && (
                  <div className="mb-4 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-center justify-center">
                    ⚠️ Configurez votre VMA pour voir vos allures personnalisées
                  </div>
                )}
                <ProgramSteps elements={sessionSteps} userVma={userVma} />
              </div>

              {/* Desktop: Tabs avec Détail + Graphique */}
              <div className="hidden md:block">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="details" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      <span>Détail</span>
                    </TabsTrigger>
                    <TabsTrigger value="graph" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Graphique</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-0">
                    {!userVma && (
                      <div className="mb-4 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-center justify-center">
                        ⚠️ Configurez votre VMA pour voir vos allures personnalisées
                      </div>
                    )}
                    <ProgramSteps elements={sessionSteps} userVma={userVma} />
                  </TabsContent>

                  <TabsContent value="graph" className="mt-0">
                    {program ? (
                      <div className="bg-white p-2 sm:p-4 rounded-lg border shadow-sm">
                        <SpeedChart program={program} />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Données insuffisantes pour le graphique
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          {/* Actions - Télécharger PDF / Recevoir par email */}
          <div className="mt-6 pt-4 border-t">
            <SessionActions
              sessionId={session.id}
              sessionName={session.name}
              sessionDate={session.sessionDate || undefined}
              variant="compact"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
});

SessionCard.displayName = 'SessionCard';

// --- HOME CONTENT PRINCIPAL ---

export function HomeContent({ userId, firstName, userVma, userRole, userStatus, currentWeek, nextWeek }: HomeContentProps) {
  const [showingNextWeek, setShowingNextWeek] = useState(false);
  const [vmaDialogOpen, setVmaDialogOpen] = useState(false);

  const displayedWeek = showingNextWeek ? nextWeek : currentWeek;
  const { sessions, events, weekStart, weekEnd } = displayedWeek;
  const hasNextWeekContent = nextWeek.sessions.length > 0 || nextWeek.events.length > 0;

  // Refs pour les cartes de session et flag pour éviter de scroller plusieurs fois
  const sessionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const todaySessionScrolled = useRef(false);

  // Trouver l'index de la session du jour
  const todaySessionIndex = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for date comparison

    return sessions.findIndex(session => {
      if (!session.sessionDate) return false;
      const sessionDate = new Date(session.sessionDate);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
  }, [sessions]);

  const weekLabel = showingNextWeek ? "Semaine prochaine" : "Cette semaine";
  const weekDateRange = `${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM", { locale: fr })}`;

  // Hook onboarding pour les athlètes
  const { shouldShowOnboarding, startOnboarding } = useAthleteOnboarding({
    userRole,
    userStatus,
    hasVma: !!userVma,
  });

  // Déclencher l'onboarding automatiquement après le montage du composant
  useEffect(() => {
    if (shouldShowOnboarding && userId) {
      // Petit délai pour s'assurer que tous les éléments sont rendus
      const timer = setTimeout(() => {
        startOnboarding();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, userId, startOnboarding]);

  // Scroller vers la session du jour après le montage
  useEffect(() => {
    if (!showingNextWeek && todaySessionIndex !== -1 && !todaySessionScrolled.current && sessions.length > 0) {
      const todaySessionId = sessions[todaySessionIndex]?.id;
      const element = sessionRefs.current[todaySessionId];

      if (element) {
        // Petit délai pour s'assurer que le rendu est terminé et que la carte est ouverte
        const timer = setTimeout(() => {
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - 100; // 100px offset pour le header et un peu d'espace

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          todaySessionScrolled.current = true;
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [sessions, todaySessionIndex, showingNextWeek]);

  // Réinitialiser le flag de scroll quand on change de semaine
  useEffect(() => {
    todaySessionScrolled.current = false;
  }, [showingNextWeek]);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative mx-auto px-4 py-16 sm:py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                ASUL Bron - Équipe Javier
              </span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {userId ? (
                <>Bonjour <span className="text-primary">{firstName}</span> 👋</>
              ) : (
                <>Bienvenue sur <span className="text-primary">ASUL Team</span></>
              )}
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {userId ? "Voici un aperçu de votre semaine d'entraînement" : "Votre plateforme d'entraînement personnalisée pour atteindre vos objectifs"}
            </p>

            {userId ? (
              <div className="flex justify-center mt-6">
                  <Button
                      variant="outline"
                      className="bg-white/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5"
                      onClick={() => setVmaDialogOpen(true)}
                      data-onboarding="vma-button"
                  >
                      <Activity className="h-4 w-4 mr-2 text-primary" />
                      {userVma ? `Ma VMA : ${userVma} km/h` : "Configurer ma VMA"}
                  </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="text-base">
                  <Link href="/sign-in">
                    Se connecter
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link href="/sign-up">
                    Créer un compte
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        {userId ? (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Navigation Semaine */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{weekLabel}</h2>
                  <p className="text-sm text-muted-foreground">{weekDateRange}</p>
                </div>
                {!showingNextWeek && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Actuelle</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto" data-onboarding="week-navigation">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowingNextWeek(false)}
                  disabled={!showingNextWeek}
                  className="flex-1 md:flex-none"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Semaine actuelle
                </Button>

                {hasNextWeekContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowingNextWeek(true)}
                    disabled={showingNextWeek}
                    className="flex-1 md:flex-none"
                  >
                    Semaine prochaine <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* Séances */}
            <section data-onboarding="sessions-section">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">Séances d&apos;entraînement</h3>
                  <p className="text-sm text-muted-foreground">
                    {sessions.length > 0
                      ? `${sessions.length} séance${sessions.length > 1 ? 's' : ''} planifiée${sessions.length > 1 ? 's' : ''}`
                      : "Aucune séance planifiée"
                    }
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/planning">Planning complet <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>

              {sessions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {sessions.map((session, index) => (
                    <SessionCard
                      key={session.id}
                      ref={(el) => {
                        if (el) sessionRefs.current[session.id] = el;
                      }}
                      session={session}
                      userVma={userVma}
                      defaultExpanded={index === todaySessionIndex}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center mb-4">
                      Aucune séance planifiée pour {showingNextWeek ? "la semaine prochaine" : "cette semaine"}
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/planning">Consulter le planning</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Événements */}
            {events.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">Événements</h3>
                    <p className="text-sm text-muted-foreground">Courses et rassemblements</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-1">{event.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(event.eventDate), "EEEE d MMMM", { locale: fr })}
                              {event.startTime && (
                                <span className="font-medium text-foreground">à {event.startTime}</span>
                              )}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {event.type === 'race' ? '🏁 Course' : event.type === 'gathering' ? '🍺 Social' : '📅 Autre'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        )}
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* les Actions Rapides */}
            <section>
              <h3 className="text-xl font-semibold mb-6">Actions rapides</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                  <Link href="/training" className="block h-full">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Dumbbell className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Créer un entraînement</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">Construisez une séance personnalisée</CardDescription>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                  <Link href="/planning" className="block h-full">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <CalendarDays className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Planning complet</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">Consultez toutes vos séances planifiées</CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </section>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6 md:grid-cols-3 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Planning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Consultez et téléchargez vos séances d&apos;entraînement planifiées
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    Création
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Créez vos propres programmes d&apos;entraînement personnalisés
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Événements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Suivez les courses et rassemblements du club
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  Prêt à commencer ?
                </CardTitle>
                <CardDescription className="text-base">
                  Rejoignez l&apos;équipe ASUL et accédez à tous les outils d&apos;entraînement
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/sign-in">
                    Se connecter
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-up">
                    Créer un compte
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <VmaDialog 
        open={vmaDialogOpen} 
        onOpenChange={setVmaDialogOpen} 
        currentVma={userVma || undefined} 
      />
    </main>
  );
}